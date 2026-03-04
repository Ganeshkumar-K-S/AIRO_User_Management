"""Tests for tailor_engine module (uses mocked Groq API)."""

import json
import pytest
from unittest.mock import patch, MagicMock

from resume_generator.tailoring.tailor_engine import (
    tailor_resume,
    _parse_json_response,
    _merge_tailored,
)


@pytest.fixture
def sample_resume():
    return {
        "name": "Test User",
        "email": "test@example.com",
        "professional_summary": "A software developer.",
        "skills": ["Python", "Flask", "MySQL", "HTML", "CSS"],
        "experience": [
            {
                "role": "Software Intern",
                "company": "TechCorp",
                "duration": "Jun 2024 - Aug 2024",
                "description": [
                    "Developed REST APIs using Flask",
                    "Wrote unit tests",
                ],
            }
        ],
        "projects": [
            {
                "title": "Web App",
                "tech": ["Python", "Flask"],
                "description": ["Built a web application with REST APIs"],
            }
        ],
        "education": [
            {"degree": "B.E.", "institution": "Test University", "year": "2022-2026"}
        ],
    }


@pytest.fixture
def sample_jd():
    return {
        "role": "Backend Python Developer",
        "required_skills": ["Python", "REST APIs", "SQL"],
        "preferred_skills": ["Docker", "AWS"],
        "responsibilities": ["Design REST APIs", "Write backend code"],
    }


@pytest.fixture
def mock_llm_response():
    """A valid LLM response that doesn't fabricate anything."""
    return {
        "professional_summary": "Backend developer skilled in Python and REST APIs.",
        "experience": [
            {
                "role": "Software Intern",
                "company": "TechCorp",
                "duration": "Jun 2024 - Aug 2024",
                "description": [
                    "Developed scalable REST APIs using Python and Flask",
                    "Implemented comprehensive unit testing suite",
                ],
            }
        ],
        "projects": [
            {
                "title": "Web App",
                "tech": ["Python", "Flask"],
                "description": ["Architected REST API backend serving web application"],
            }
        ],
        "skills_categorized": {
            "Backend": ["Python", "Flask", "SQL"],
            "DevOps": ["Docker"],
        },
        "section_order": [
            "professional_summary", "skills", "experience",
            "projects", "education",
        ],
    }


class TestParseJsonResponse:
    """Test _parse_json_response function."""

    def test_clean_json(self):
        result = _parse_json_response('{"key": "value"}')
        assert result == {"key": "value"}

    def test_json_with_markdown_fences(self):
        text = '```json\n{"key": "value"}\n```'
        result = _parse_json_response(text)
        assert result == {"key": "value"}

    def test_json_with_surrounding_text(self):
        text = 'Here is the result:\n{"key": "value"}\nDone!'
        result = _parse_json_response(text)
        assert result == {"key": "value"}

    def test_invalid_json_raises(self):
        with pytest.raises(json.JSONDecodeError):
            _parse_json_response("not json at all")


class TestMergeTailored:
    """Test _merge_tailored function."""

    def test_preserves_original_fields(self, sample_resume, mock_llm_response):
        merged = _merge_tailored(sample_resume, mock_llm_response, ["Python", "Flask"])

        # Original fields preserved
        assert merged["name"] == "Test User"
        assert merged["email"] == "test@example.com"
        assert merged["education"] == sample_resume["education"]

    def test_overwrites_llm_fields(self, sample_resume, mock_llm_response):
        merged = _merge_tailored(sample_resume, mock_llm_response, ["Python", "Flask"])

        assert merged["professional_summary"] == mock_llm_response["professional_summary"]
        assert merged["experience"] == mock_llm_response["experience"]
        assert merged["section_order"] == mock_llm_response["section_order"]

    def test_skills_from_rule_engine(self, sample_resume, mock_llm_response):
        tailored_skills = ["Python", "Flask", "REST APIs"]
        merged = _merge_tailored(sample_resume, mock_llm_response, tailored_skills)

        # Skills come from rule-based engine, not LLM
        assert merged["skills"] == tailored_skills


class TestTailorResume:
    """Test tailor_resume with mocked Groq API."""

    @patch("resume_generator.tailoring.tailor_engine._call_groq")
    def test_successful_tailoring(
        self, mock_groq, sample_resume, sample_jd, mock_llm_response
    ):
        mock_groq.return_value = mock_llm_response

        result = tailor_resume(
            sample_resume, sample_jd, api_key="test-key", verbose=False
        )

        assert isinstance(result, dict)
        assert "skills" in result
        assert "section_order" in result
        assert result["name"] == "Test User"  # preserved
        mock_groq.assert_called_once()

    @patch("resume_generator.tailoring.tailor_engine._call_groq")
    def test_fallback_on_llm_error(self, mock_groq, sample_resume, sample_jd):
        mock_groq.side_effect = RuntimeError("API error")

        result = tailor_resume(
            sample_resume, sample_jd, api_key="test-key", verbose=False
        )

        # Should fall back to original with tailored skills
        assert isinstance(result, dict)
        assert result["name"] == "Test User"
        assert "skills" in result

    @patch("resume_generator.tailoring.tailor_engine._call_groq")
    def test_fallback_on_validation_failure(
        self, mock_groq, sample_resume, sample_jd
    ):
        # LLM fabricates a company
        bad_response = {
            "professional_summary": "Tailored summary",
            "experience": [
                {"company": "TechCorp", "duration": "Jun 2024 - Aug 2024",
                 "description": ["Did work"]},
                {"company": "FakeCompany", "description": ["Fabricated"]},
            ],
            "projects": [],
            "skills_categorized": {},
            "section_order": ["skills", "experience"],
        }
        mock_groq.return_value = bad_response

        result = tailor_resume(
            sample_resume, sample_jd, api_key="test-key", verbose=False
        )

        # Should fall back — no fabricated companies in result
        companies = []
        for exp in result.get("experience", []):
            if "company" in exp:
                companies.append(exp["company"])
        assert "FakeCompany" not in companies

    def test_missing_api_key_raises(self, sample_resume, sample_jd):
        with patch("resume_generator.tailoring.tailor_engine.GROQ_API_KEY", ""):
            with pytest.raises(ValueError, match="API key"):
                tailor_resume(sample_resume, sample_jd, api_key="", verbose=False)
