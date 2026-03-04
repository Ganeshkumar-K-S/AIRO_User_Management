# ──────────────────────────────────────────────────────────
# template_selector.py — Template Selection Engine
#
# Analyzes a user profile and selects the best LaTeX template.
# Uses keyword-based scoring against domain keyword sets:
#   academic, data_science, software, fresher
#
# Public API:
#   select_template(profile) → template name string
# ──────────────────────────────────────────────────────────

import re
from typing import Dict, List, Any


ACADEMIC_KEYWORDS = {
    "research", "publication", "paper", "journal", "conference",
    "phd", "postdoc", "thesis", "dissertation", "academic",
}

DATA_SCIENCE_KEYWORDS = {
    "machine learning", "ml", "deep learning", "ai", "artificial intelligence",
    "data science", "data analysis", "data analytics", "tensorflow", "pytorch",
    "scikit-learn", "sklearn", "keras", "pandas", "numpy", "scipy",
    "neural network", "nlp", "computer vision", "cv", "data mining",
    "big data", "spark", "hadoop", "data engineer", "data scientist",
}

SOFTWARE_KEYWORDS = {
    "software", "developer", "engineer", "programming", "coding",
    "java", "javascript", "typescript", "c++", "c#", "go", "rust",
    "react", "angular", "vue", "node", "django", "flask", "spring",
    "backend", "frontend", "full stack", "fullstack", "web development",
    "mobile", "android", "ios", "swift", "kotlin", "api", "rest",
    "microservices", "docker", "kubernetes", "devops", "cloud",
}


def extract_keywords(profile: Dict[str, Any]) -> List[str]:
    """Extract all text from profile for keyword matching."""
    keywords = []

    if "skills" in profile and profile["skills"]:
        keywords.extend([s.lower() for s in profile["skills"]])

    if "skills_categorized" in profile and profile["skills_categorized"]:
        for category, skill_list in profile["skills_categorized"].items():
            keywords.append(category.lower())
            keywords.extend([s.lower() for s in skill_list])

    if "projects" in profile and profile["projects"]:
        for project in profile["projects"]:
            if "title" in project:
                keywords.append(project["title"].lower())
            if "description" in project:
                desc = project["description"]
                if isinstance(desc, list):
                    keywords.extend([d.lower() for d in desc])
                else:
                    keywords.append(desc.lower())
            if "tech" in project and project["tech"]:
                keywords.extend([t.lower() for t in project["tech"]])

    if "experience" in profile and profile["experience"]:
        for exp in profile["experience"]:
            if "role" in exp:
                keywords.append(exp["role"].lower())
            if "domain" in exp:
                keywords.append(exp["domain"].lower())
            if "description" in exp:
                desc = exp["description"]
                if isinstance(desc, list):
                    keywords.extend([d.lower() for d in desc])
                else:
                    keywords.append(desc.lower())

    if "education" in profile and profile["education"]:
        for edu in profile["education"]:
            if "field" in edu:
                keywords.append(edu["field"].lower())
            if "degree" in edu:
                keywords.append(edu["degree"].lower())

    return keywords


def count_keyword_matches(keywords: List[str], keyword_set: set) -> int:
    """Count whole-word matches between profile keywords and a domain set."""
    count = 0
    for keyword in keywords:
        for domain_keyword in keyword_set:
            pattern = r"\b" + re.escape(domain_keyword) + r"\b"
            if re.search(pattern, keyword):
                count += 1
    return count


def select_template(profile: Dict[str, Any]) -> str:
    """Select the best LaTeX template for this profile."""
    keywords = extract_keywords(profile)

    data_score = count_keyword_matches(keywords, DATA_SCIENCE_KEYWORDS)
    soft_score = count_keyword_matches(keywords, SOFTWARE_KEYWORDS)
    acad_score = count_keyword_matches(keywords, ACADEMIC_KEYWORDS)

    has_exp = bool(profile.get("experience"))

    # Academic priority
    if profile.get("publications") or acad_score > max(data_score, soft_score):
        return "academic"

    # Fresher logic
    if not has_exp:
        if data_score > soft_score and data_score > 0:
            return "data_science"
        elif soft_score > 0:
            return "software"
        else:
            return "fresher"

    # Experienced domain
    if data_score > soft_score:
        return "data_science"
    elif soft_score > 0:
        return "software"

    return "software"
