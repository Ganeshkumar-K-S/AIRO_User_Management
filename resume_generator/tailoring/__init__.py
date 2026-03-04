# ──────────────────────────────────────────────────────────
# Resume Tailoring Package
# AI-powered resume tailoring and gap analysis using
# LLM + rule-based + embedding-based logic.
# ──────────────────────────────────────────────────────────

from .tailor_engine import tailor_resume
from .gap_analyzer import analyze_gap, compare_jds, print_gap_report, print_comparison_matrix
from .skill_scorer import cluster_skills
from .quality_scorer import score_response_quality, detect_vague_bullets

__all__ = [
    "tailor_resume",
    "analyze_gap",
    "compare_jds",
    "print_gap_report",
    "print_comparison_matrix",
    "cluster_skills",
    "score_response_quality",
    "detect_vague_bullets",
]
