"""Tests for validators module."""

import pytest
from resume_generator.tailoring.validators import validate_tailored_resume


@pytest.fixture
def original_resume():
    return {
        "name": "Test User",
        "experience": [
            {
                "role": "Software Intern",
                "company": "TechCorp",
                "duration": "Jun 2024 - Aug 2024",
                "description": ["Built APIs", "Wrote tests"],
            }
        ],
        "projects": [
            {"title": "Project A", "description": ["Built a website"]},
            {"title": "Project B", "description": ["Built an app"]},
        ],
        "education": [
            {
                "degree": "B.E.",
                "institution": "SSN College",
                "year": "2022-2026",
            }
        ],
    }


class TestValidateTailoredResume:
    """Test validate_tailored_resume function."""

    def test_valid_tailored_resume(self, original_resume):
        tailored = {
            "name": "Test User",
            "experience": [
                {
                    "role": "Software Intern",
                    "company": "TechCorp",
                    "duration": "Jun 2024 - Aug 2024",
                    "description": ["Developed REST APIs using Flask", "Wrote unit tests"],
                }
            ],
            "projects": [
                {"title": "Project A", "description": ["Built a responsive website"]},
            ],
            "education": [
                {
                    "degree": "B.E.",
                    "institution": "SSN College",
                    "year": "2022-2026",
                }
            ],
        }
        result = validate_tailored_resume(original_resume, tailored)
        assert result.is_valid is True
        assert len(result.violations) == 0

    def test_fabricated_company(self, original_resume):
        tailored = {
            "experience": [
                {"company": "TechCorp", "duration": "Jun 2024 - Aug 2024"},
                {"company": "FakeCompany Inc"},  # fabricated
            ],
            "projects": [],
            "education": [{"degree": "B.E.", "institution": "SSN College", "year": "2022-2026"}],
        }
        result = validate_tailored_resume(original_resume, tailored)
        assert result.is_valid is False
        assert any("compan" in v.lower() for v in result.violations)

    def test_fabricated_institution(self, original_resume):
        tailored = {
            "experience": [{"company": "TechCorp", "duration": "Jun 2024 - Aug 2024"}],
            "projects": [],
            "education": [
                {"degree": "B.E.", "institution": "MIT", "year": "2022-2026"},  # fabricated
            ],
        }
        result = validate_tailored_resume(original_resume, tailored)
        assert result.is_valid is False
        assert any("institution" in v.lower() for v in result.violations)

    def test_fabricated_degree(self, original_resume):
        tailored = {
            "experience": [{"company": "TechCorp", "duration": "Jun 2024 - Aug 2024"}],
            "projects": [],
            "education": [
                {"degree": "Ph.D.", "institution": "SSN College", "year": "2022-2026"},  # fabricated
            ],
        }
        result = validate_tailored_resume(original_resume, tailored)
        assert result.is_valid is False
        assert any("degree" in v.lower() for v in result.violations)

    def test_experience_count_increased(self, original_resume):
        tailored = {
            "experience": [
                {"company": "TechCorp", "duration": "Jun 2024 - Aug 2024"},
                {"company": "TechCorp", "duration": "Jun 2024 - Aug 2024"},  # duplicate but count matters
            ],
            "projects": [],
            "education": [{"degree": "B.E.", "institution": "SSN College", "year": "2022-2026"}],
        }
        result = validate_tailored_resume(original_resume, tailored)
        assert result.is_valid is False
        assert any("experience count" in v.lower() for v in result.violations)

    def test_project_count_increased(self, original_resume):
        tailored = {
            "experience": [{"company": "TechCorp", "duration": "Jun 2024 - Aug 2024"}],
            "projects": [
                {"title": "A"}, {"title": "B"}, {"title": "C"},  # 3 > 2 original
            ],
            "education": [{"degree": "B.E.", "institution": "SSN College", "year": "2022-2026"}],
        }
        result = validate_tailored_resume(original_resume, tailored)
        assert result.is_valid is False
        assert any("project count" in v.lower() for v in result.violations)

    def test_date_alteration_warning(self, original_resume):
        tailored = {
            "experience": [
                {
                    "company": "TechCorp",
                    "duration": "Jan 2024 - Dec 2024",  # changed date
                }
            ],
            "projects": [],
            "education": [{"degree": "B.E.", "institution": "SSN College", "year": "2022-2026"}],
        }
        result = validate_tailored_resume(original_resume, tailored)
        # Date changes are warnings, not violations
        assert len(result.warnings) > 0
