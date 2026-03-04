"""Tests for skill_scorer module."""

import pytest
from resume_generator.tailoring.jd_parser import JDProfile
from resume_generator.tailoring.skill_scorer import (
    score_skills,
    prune_skills,
    expand_skills,
    ScoredSkill,
)


@pytest.fixture
def backend_jd():
    return JDProfile(
        role="Backend Python Developer",
        required_skills={"python", "rest apis", "sql"},
        preferred_skills={"docker", "aws"},
        responsibility_keywords={"design rest apis", "write backend code", "agile"},
        domain="software",
    )


@pytest.fixture
def sample_resume():
    return {
        "skills": ["Python", "Flask", "MySQL", "HTML", "CSS", "Photoshop", "C++", "Java"],
        "projects": [
            {
                "title": "E-Commerce Platform",
                "tech": ["React", "Node.js", "MongoDB", "Stripe"],
                "description": [
                    "Built full-stack e-commerce application",
                    "Designed RESTful API serving 1000+ concurrent requests",
                ],
            }
        ],
        "experience": [
            {
                "role": "Software Development Intern",
                "description": [
                    "Developed RESTful APIs using Node.js and Express",
                    "Implemented authentication system using JWT and OAuth 2.0",
                ],
            }
        ],
    }


class TestScoreSkills:
    """Test score_skills function."""

    def test_required_exact_match(self, backend_jd):
        scored = score_skills(["Python"], backend_jd)
        assert len(scored) == 1
        assert scored[0].score == 1.0
        assert scored[0].reason == "required_exact"

    def test_preferred_exact_match(self, backend_jd):
        scored = score_skills(["Docker"], backend_jd)
        assert len(scored) == 1
        assert scored[0].score == 0.8
        assert scored[0].reason == "preferred_exact"

    def test_alias_match_required(self, backend_jd):
        # MySQL is an alias of SQL
        scored = score_skills(["MySQL"], backend_jd)
        assert len(scored) == 1
        assert scored[0].score >= 0.6  # fuzzy or alias match

    def test_no_match(self, backend_jd):
        scored = score_skills(["Photoshop"], backend_jd)
        assert len(scored) == 1
        assert scored[0].score == 0.0
        assert scored[0].reason == "no_match"

    def test_multiple_skills(self, backend_jd):
        skills = ["Python", "Docker", "Photoshop"]
        scored = score_skills(skills, backend_jd)
        assert len(scored) == 3
        assert scored[0].score == 1.0   # Python - required
        assert scored[1].score == 0.8   # Docker - preferred
        assert scored[2].score == 0.0   # Photoshop - no match

    def test_preserves_order(self, backend_jd):
        skills = ["Java", "Python", "CSS"]
        scored = score_skills(skills, backend_jd)
        assert [s.name for s in scored] == ["Java", "Python", "CSS"]


class TestPruneSkills:
    """Test prune_skills function."""

    def test_no_prune_needed(self):
        scored = [
            ScoredSkill("Python", 1.0, "required"),
            ScoredSkill("Docker", 0.8, "preferred"),
        ]
        result = prune_skills(scored, max_count=5)
        assert "Python" in result
        assert "Docker" in result

    def test_removes_zero_scored(self):
        scored = [
            ScoredSkill("Python", 1.0, "required"),
            ScoredSkill("Docker", 0.8, "preferred"),
            ScoredSkill("Flask", 0.6, "fuzzy"),
            ScoredSkill("SQL", 0.6, "fuzzy"),
            ScoredSkill("Git", 0.3, "in_resp"),
            ScoredSkill("Photoshop", 0.0, "no_match"),
        ]
        result = prune_skills(scored, max_count=6)
        assert "Photoshop" not in result
        assert "Python" in result

    def test_respects_max_count(self):
        scored = [ScoredSkill(f"Skill{i}", 1.0, "required") for i in range(20)]
        result = prune_skills(scored, max_count=8)
        assert len(result) <= 8

    def test_keeps_min_skills(self):
        scored = [
            ScoredSkill("Python", 1.0, "required"),
            ScoredSkill("A", 0.0, "no_match"),
            ScoredSkill("B", 0.0, "no_match"),
            ScoredSkill("C", 0.0, "no_match"),
            ScoredSkill("D", 0.0, "no_match"),
        ]
        result = prune_skills(scored, max_count=2)
        assert len(result) >= 1  # At least Python


class TestExpandSkills:
    """Test expand_skills function."""

    def test_infers_from_project_description(self, backend_jd, sample_resume):
        current = ["Python", "Flask", "MySQL"]
        inferred = expand_skills(sample_resume, backend_jd, current)
        # "REST APIs" or "Rest Apis" should be inferred from project descriptions
        inferred_lower = [s.lower() for s in inferred]
        assert any("rest" in s for s in inferred_lower)

    def test_no_inference_when_already_listed(self, backend_jd, sample_resume):
        current = ["Python", "Flask", "MySQL", "REST APIs", "Docker", "AWS", "SQL"]
        inferred = expand_skills(sample_resume, backend_jd, current)
        # Should not re-add already listed skills
        for skill in inferred:
            assert skill.lower() not in {s.lower() for s in current}

    def test_returns_empty_when_no_evidence(self):
        jd = JDProfile(
            required_skills={"kubernetes", "terraform"},
            preferred_skills=set(),
            responsibility_keywords=set(),
        )
        resume = {
            "projects": [{"description": "Built a website"}],
            "experience": [],
        }
        inferred = expand_skills(resume, jd, ["Python"])
        assert len(inferred) == 0
