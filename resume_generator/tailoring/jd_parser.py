# ──────────────────────────────────────────────────────────
# jd_parser.py — Job Description Parser
#
# Parses a job description dict into a structured JDProfile.
# Extracts required/preferred skills, responsibility keywords,
# and detects the JD domain (software, data_science, academic).
#
# Public API:
#   parse_jd(jd_dict)          → JDProfile dataclass
#   extract_jd_keywords(jd)    → dict of keyword sets
# ──────────────────────────────────────────────────────────

import re
from dataclasses import dataclass, field
from typing import Dict, Any, Set


STOPWORDS = {
    "the", "a", "an", "and", "or", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did",
    "will", "would", "could", "should", "may", "might", "can",
    "shall", "must", "need", "that", "this", "these", "those",
    "it", "its", "we", "our", "you", "your", "they", "their",
    "as", "but", "if", "not", "no", "so", "up", "out", "about",
    "into", "over", "after", "before", "between", "under",
}

# Domain keyword sets for heuristic detection
DATA_SCIENCE_SIGNALS = {
    "machine learning", "deep learning", "data science", "data analysis",
    "ml", "ai", "artificial intelligence", "tensorflow", "pytorch",
    "neural network", "nlp", "computer vision", "data engineer",
}

ACADEMIC_SIGNALS = {
    "research", "publication", "phd", "postdoc", "professor",
    "thesis", "dissertation", "journal", "academic",
}


@dataclass
class JDProfile:
    """Structured representation of a job description."""
    role: str = ""
    required_skills: Set[str] = field(default_factory=set)
    preferred_skills: Set[str] = field(default_factory=set)
    responsibility_keywords: Set[str] = field(default_factory=set)
    domain: str = "software"

    @property
    def all_skills(self) -> Set[str]:
        return self.required_skills | self.preferred_skills


def _normalize_set(items) -> Set[str]:
    """Normalize a list of strings to lowercase set."""
    if not items:
        return set()
    if isinstance(items, str):
        return {items.strip().lower()}
    return {s.strip().lower() for s in items if isinstance(s, str)}


def _extract_keywords_from_text(text: str) -> Set[str]:
    """Extract meaningful keywords from text, removing stopwords."""
    words = re.findall(r"[a-z][a-z0-9+#.-]+", text.lower())
    return {w for w in words if w not in STOPWORDS and len(w) > 2}


def _detect_domain(jd: Dict[str, Any], skills: Set[str], keywords: Set[str]) -> str:
    """Detect JD domain from role title, skills, and keywords."""
    all_text = " ".join([
        jd.get("role", ""),
        jd.get("domain", ""),
        " ".join(skills),
        " ".join(keywords),
    ]).lower()

    ds_score = sum(1 for sig in DATA_SCIENCE_SIGNALS if sig in all_text)
    ac_score = sum(1 for sig in ACADEMIC_SIGNALS if sig in all_text)

    if ac_score > max(ds_score, 1):
        return "academic"
    if ds_score >= 2:
        return "data_science"
    return "software"


def parse_jd(jd: Any) -> JDProfile:
    """
    Parse a JD dict into a structured JDProfile.

    Raises ValueError if jd is not a dictionary.
    """
    if not isinstance(jd, dict):
        raise ValueError("Job description must be a dictionary")

    required = _normalize_set(jd.get("required_skills", []))
    preferred = _normalize_set(jd.get("preferred_skills", []))

    # Extract responsibility keywords
    resp_raw = jd.get("responsibilities", [])
    if isinstance(resp_raw, str):
        resp_raw = [resp_raw]
    resp_keywords = set()
    for item in resp_raw:
        if isinstance(item, str):
            resp_keywords.update(_extract_keywords_from_text(item))

    all_skills = required | preferred
    domain = _detect_domain(jd, all_skills, resp_keywords)

    return JDProfile(
        role=jd.get("role", ""),
        required_skills=required,
        preferred_skills=preferred,
        responsibility_keywords=resp_keywords,
        domain=domain,
    )


def extract_jd_keywords(jd: Dict[str, Any]) -> Dict[str, set]:
    """Extract all keyword categories from JD for quick lookup."""
    profile = parse_jd(jd)
    return {
        "required_skills": profile.required_skills,
        "preferred_skills": profile.preferred_skills,
        "responsibility_keywords": profile.responsibility_keywords,
        "all_skills": profile.all_skills,
        "domain": {profile.domain},
    }
