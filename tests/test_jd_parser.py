"""Tests for jd_parser module."""

import pytest
from resume_generator.tailoring.jd_parser import parse_jd, extract_jd_keywords, JDProfile


class TestParseJD:
    """Test parse_jd function."""

    def test_valid_jd(self):
        jd = {
            "role": "Backend Python Developer",
            "required_skills": ["Python", "REST APIs", "SQL"],
            "preferred_skills": ["Docker", "AWS"],
            "responsibilities": [
                "Design REST APIs",
                "Write clean backend code",
            ],
        }
        profile = parse_jd(jd)

        assert isinstance(profile, JDProfile)
        assert profile.role == "Backend Python Developer"
        assert "python" in profile.required_skills
        assert "rest apis" in profile.required_skills
        assert "sql" in profile.required_skills
        assert "docker" in profile.preferred_skills
        assert "aws" in profile.preferred_skills
        assert profile.domain == "software"

    def test_missing_optional_fields(self):
        jd = {"role": "Analyst"}
        profile = parse_jd(jd)

        assert profile.role == "Analyst"
        assert profile.required_skills == set()
        assert profile.preferred_skills == set()
        assert isinstance(profile.responsibility_keywords, set)

    def test_empty_jd(self):
        profile = parse_jd({})
        assert profile.role == ""
        assert profile.required_skills == set()

    def test_invalid_jd_type(self):
        with pytest.raises(ValueError, match="dictionary"):
            parse_jd("not a dict")

    def test_data_science_domain(self):
        jd = {
            "role": "Data Scientist",
            "required_skills": ["Python", "Machine Learning", "Deep Learning"],
            "responsibilities": ["Build ML models", "Data analysis"],
        }
        profile = parse_jd(jd)
        assert profile.domain == "data_science"

    def test_academic_domain(self):
        jd = {
            "role": "Research Professor",
            "responsibilities": ["Conduct research and publish papers"],
        }
        profile = parse_jd(jd)
        assert profile.domain == "academic"

    def test_all_skills_property(self):
        jd = {
            "role": "Dev",
            "required_skills": ["Python"],
            "preferred_skills": ["Docker"],
        }
        profile = parse_jd(jd)
        assert profile.all_skills == {"python", "docker"}


class TestExtractJDKeywords:
    """Test extract_jd_keywords function."""

    def test_extracts_all_categories(self):
        jd = {
            "required_skills": ["Python", "SQL"],
            "preferred_skills": ["Docker"],
            "responsibilities": ["Build APIs and services"],
        }
        keywords = extract_jd_keywords(jd)

        assert "python" in keywords["required_skills"]
        assert "sql" in keywords["required_skills"]
        assert "docker" in keywords["preferred_skills"]
        assert len(keywords["responsibility_keywords"]) > 0

    def test_normalizes_to_lowercase(self):
        jd = {"required_skills": ["PYTHON", "React.js"]}
        keywords = extract_jd_keywords(jd)
        assert "python" in keywords["required_skills"]
        assert "react.js" in keywords["required_skills"]

    def test_handles_string_responsibilities(self):
        jd = {"responsibilities": "Build scalable APIs"}
        keywords = extract_jd_keywords(jd)
        assert len(keywords["responsibility_keywords"]) > 0
