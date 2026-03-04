# ──────────────────────────────────────────────────────────
# test_quality_scorer.py — Tests for quality_scorer module
# ──────────────────────────────────────────────────────────

import pytest
from resume_generator.tailoring.quality_scorer import (
    score_response_quality,
    detect_vague_bullets,
    QualityResult,
)


class TestDetectVagueBullets:
    """Tests for vague bullet detection."""

    def test_detects_vague_starts(self):
        llm_output = {
            "experience": [{
                "description": [
                    "Worked on improving the backend code",
                    "Helped with data migration tasks",
                    "Responsible for testing",
                ]
            }]
        }
        vague = detect_vague_bullets(llm_output)
        assert len(vague) == 3

    def test_accepts_strong_bullets(self):
        llm_output = {
            "experience": [{
                "description": [
                    "Developed REST APIs using Flask serving 10K requests/day",
                    "Reduced database query latency by 40% through index optimization",
                    "Implemented CI/CD pipeline using GitHub Actions and Docker",
                ]
            }]
        }
        vague = detect_vague_bullets(llm_output)
        assert len(vague) == 0

    def test_detects_short_bullets(self):
        llm_output = {
            "projects": [{
                "description": ["Built APIs", "Used Docker", "Fixed bugs"]
            }]
        }
        vague = detect_vague_bullets(llm_output)
        assert len(vague) >= 2


class TestScoreResponseQuality:
    """Tests for overall quality scoring."""

    def test_high_quality_response(self):
        llm_output = {
            "professional_summary": "Experienced Python developer with expertise in REST APIs and cloud services",
            "experience": [{
                "description": [
                    "Developed scalable REST APIs using Python and Flask, handling 50K daily requests",
                    "Optimized PostgreSQL queries reducing average response time by 35%",
                    "Deployed microservices using Docker containers on AWS ECS",
                ]
            }],
            "projects": [{
                "description": [
                    "Built real-time data pipeline processing 1M events per hour using Apache Kafka",
                    "Implemented automated testing framework achieving 90% code coverage",
                ]
            }],
            "skills_categorized": {"Backend": ["Python", "Flask", "REST APIs"]},
            "section_order": ["professional_summary", "skills", "experience"],
        }
        jd_keywords = {"python", "flask", "rest apis", "docker", "aws", "postgresql"}
        result = score_response_quality(llm_output, jd_keywords, {})
        assert result.overall_score > 0.5
        assert result.is_acceptable is True
        assert result.strong_verb_ratio > 0.5

    def test_low_quality_response(self):
        llm_output = {
            "experience": [{
                "description": [
                    "Worked on stuff",
                    "Did things",
                    "Helped team",
                ]
            }],
        }
        jd_keywords = {"python", "flask", "docker", "aws", "kubernetes", "terraform"}
        result = score_response_quality(llm_output, jd_keywords, {})
        assert result.vague_bullet_count >= 2
        assert result.keyword_density < 0.3
        assert result.section_coverage < 0.5

    def test_empty_response(self):
        result = score_response_quality({}, {"python"}, {})
        assert result.total_bullet_count == 0
        assert result.section_coverage == 0.0
