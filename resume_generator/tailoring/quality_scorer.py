# ──────────────────────────────────────────────────────────
# quality_scorer.py — LLM Response Quality Scoring
#
# Post-LLM quality assessment beyond safety validation:
#   - Bullet point quality detection (vague vs actionable)
#   - Keyword density measurement
#   - Section coverage verification
#   - Overall quality score (0.0-1.0)
#
# Public API:
#   score_response_quality(llm_output, jd, original) -> QualityResult
#   detect_vague_bullets(llm_output)                 -> List[str]
# ──────────────────────────────────────────────────────────

import re
from dataclasses import dataclass, field
from typing import Dict, Any, List, Set

from .config import MIN_BULLET_LENGTH, MIN_KEYWORD_DENSITY, MIN_QUALITY_SCORE


# Patterns indicating vague, non-actionable bullets
VAGUE_PATTERNS = [
    r"^(worked on|helped with|assisted in|involved in|responsible for|participated in)\b",
    r"^(various|multiple|several|different|many)\b",
    r"^(did|made|used|handled)\b",
    r"\b(etc\.?|and more|and so on|things)\b",
]

# Strong action verbs that indicate good bullets
STRONG_VERBS = {
    "developed", "built", "designed", "implemented", "created", "optimized",
    "architected", "engineered", "deployed", "automated", "integrated",
    "reduced", "increased", "improved", "accelerated", "streamlined",
    "analyzed", "trained", "evaluated", "migrated", "refactored",
    "configured", "established", "led", "managed", "mentored",
    "published", "presented", "collaborated", "spearheaded",
}


@dataclass
class QualityResult:
    """Result of LLM response quality assessment."""
    overall_score: float = 0.0
    keyword_density: float = 0.0
    avg_bullet_length: float = 0.0
    section_coverage: float = 0.0
    vague_bullet_count: int = 0
    total_bullet_count: int = 0
    strong_verb_ratio: float = 0.0
    is_acceptable: bool = True
    issues: List[str] = field(default_factory=list)


def _extract_bullets(llm_output: Dict[str, Any]) -> List[str]:
    """Extract all bullet points from experience and projects."""
    bullets = []
    for section in ["experience", "projects"]:
        for item in llm_output.get(section, []):
            desc = item.get("description", "")
            if isinstance(desc, list):
                bullets.extend([str(b).strip() for b in desc if b])
            elif isinstance(desc, str) and desc.strip():
                bullets.append(desc.strip())
    return bullets


def _is_vague_bullet(text: str) -> bool:
    """Check if a bullet point uses vague or non-actionable language."""
    text_lower = text.lower().strip()
    for pattern in VAGUE_PATTERNS:
        if re.search(pattern, text_lower):
            return True
    return False


def _has_strong_verb(text: str) -> bool:
    """Check if a bullet starts with or contains a strong action verb."""
    words = text.lower().split()
    if not words:
        return False
    return words[0] in STRONG_VERBS or any(w in STRONG_VERBS for w in words[:3])


def _compute_keyword_density(llm_output: Dict[str, Any], jd_keywords: Set[str]) -> float:
    """Measure what fraction of JD keywords appear in the LLM output."""
    if not jd_keywords:
        return 1.0

    # Collect all text from LLM output
    all_text = ""
    summary = llm_output.get("professional_summary", "")
    all_text += str(summary) + " "

    for bullet in _extract_bullets(llm_output):
        all_text += bullet + " "

    skills_cat = llm_output.get("skills_categorized", {})
    if isinstance(skills_cat, dict):
        for cat_skills in skills_cat.values():
            if isinstance(cat_skills, list):
                all_text += " ".join(str(s) for s in cat_skills) + " "

    all_text_lower = all_text.lower()
    matched = sum(1 for kw in jd_keywords if kw in all_text_lower)
    return matched / len(jd_keywords)


def _compute_section_coverage(llm_output: Dict[str, Any]) -> float:
    """Check what fraction of expected sections are present and non-empty."""
    expected = ["professional_summary", "experience", "projects", "skills_categorized", "section_order"]
    present = 0
    for key in expected:
        val = llm_output.get(key)
        if val:
            present += 1
    return present / len(expected)


def detect_vague_bullets(llm_output: Dict[str, Any]) -> List[str]:
    """Identify vague bullets that should be improved."""
    vague = []
    for bullet in _extract_bullets(llm_output):
        if _is_vague_bullet(bullet):
            vague.append(bullet)
        elif len(bullet.split()) < MIN_BULLET_LENGTH:
            vague.append(bullet)
    return vague


def score_response_quality(
    llm_output: Dict[str, Any],
    jd_keywords: Set[str],
    original: Dict[str, Any],
) -> QualityResult:
    """
    Score the overall quality of an LLM tailoring response.

    Evaluates keyword density, bullet quality, section coverage,
    and action verb usage. Returns a QualityResult with a 0.0-1.0 score.
    """
    result = QualityResult()

    # Bullet analysis
    bullets = _extract_bullets(llm_output)
    result.total_bullet_count = len(bullets)

    if bullets:
        word_counts = [len(b.split()) for b in bullets]
        result.avg_bullet_length = sum(word_counts) / len(word_counts)

        vague = [b for b in bullets if _is_vague_bullet(b)]
        result.vague_bullet_count = len(vague)

        strong = [b for b in bullets if _has_strong_verb(b)]
        result.strong_verb_ratio = len(strong) / len(bullets)
    else:
        result.avg_bullet_length = 0
        result.strong_verb_ratio = 0

    # Keyword density
    result.keyword_density = _compute_keyword_density(llm_output, jd_keywords)

    # Section coverage
    result.section_coverage = _compute_section_coverage(llm_output)

    # Compute overall score (weighted)
    bullet_quality = 1.0
    if result.total_bullet_count > 0:
        vague_penalty = result.vague_bullet_count / result.total_bullet_count
        bullet_quality = max(0.0, 1.0 - vague_penalty)

    result.overall_score = round(
        0.30 * result.keyword_density
        + 0.25 * bullet_quality
        + 0.20 * result.section_coverage
        + 0.15 * result.strong_verb_ratio
        + 0.10 * min(result.avg_bullet_length / 15.0, 1.0),
        3,
    )

    # Collect issues
    if result.keyword_density < MIN_KEYWORD_DENSITY:
        result.issues.append(f"Low keyword density: {result.keyword_density:.1%}")
    if result.vague_bullet_count > 0:
        result.issues.append(f"{result.vague_bullet_count} vague bullet(s) detected")
    if result.avg_bullet_length < MIN_BULLET_LENGTH:
        result.issues.append(f"Avg bullet too short: {result.avg_bullet_length:.0f} words")
    if result.section_coverage < 0.6:
        result.issues.append(f"Missing sections: {result.section_coverage:.0%} coverage")

    result.is_acceptable = result.overall_score >= MIN_QUALITY_SCORE

    return result
