# ──────────────────────────────────────────────────────────
# skill_scorer.py — Skill Relevance Scoring Engine
#
# Deterministic + semantic skill analysis against a JD:
#   - Tiered scoring (1.0 required -> 0.0 no match)
#   - Alias-aware fuzzy matching (e.g. JS <-> JavaScript)
#   - Embedding-based semantic matching (sentence-transformers)
#   - Context-aware frequency weighting from resume text
#   - Skill pruning to fit page density limits
#   - Evidence-based skill expansion from resume text
#   - Automatic skill clustering via embeddings
#
# Public API:
#   score_skills(skills, jd_profile, resume)  -> List[ScoredSkill]
#   prune_skills(scored, max)                 -> List[str]
#   expand_skills(resume, jd, curr)           -> List[str]
#   cluster_skills(skills)                    -> Dict[str, List[str]]
# ──────────────────────────────────────────────────────────

import re
from dataclasses import dataclass
from typing import Dict, List, Any, Set, Optional

from .jd_parser import JDProfile
from .config import (
    MAX_SKILLS, MIN_SKILLS, RELEVANCE_THRESHOLD,
    EMBEDDING_MODEL, SEMANTIC_THRESHOLD, CLUSTER_THRESHOLD,
)


# Common skill synonyms / abbreviations (fast-path before embeddings)
SKILL_ALIASES: Dict[str, Set[str]] = {
    "rest":         {"rest apis", "restful", "rest api"},
    "rest apis":    {"rest", "restful", "rest api"},
    "js":           {"javascript"},
    "javascript":   {"js"},
    "ts":           {"typescript"},
    "typescript":   {"ts"},
    "postgres":     {"postgresql"},
    "postgresql":   {"postgres"},
    "mongo":        {"mongodb"},
    "mongodb":      {"mongo"},
    "k8s":          {"kubernetes"},
    "kubernetes":   {"k8s"},
    "tf":           {"tensorflow"},
    "tensorflow":   {"tf"},
    "sklearn":      {"scikit-learn"},
    "scikit-learn": {"sklearn"},
    "react.js":     {"react", "reactjs"},
    "react":        {"react.js", "reactjs"},
    "node":         {"node.js", "nodejs"},
    "node.js":      {"node", "nodejs"},
    "sql":          {"mysql", "postgresql", "sqlite", "sql server"},
    "aws":          {"amazon web services"},
    "gcp":          {"google cloud", "google cloud platform"},
    "ml":           {"machine learning"},
    "machine learning": {"ml"},
    "dl":           {"deep learning"},
    "deep learning": {"dl"},
    "ai":           {"artificial intelligence"},
    "artificial intelligence": {"ai"},
    "ci/cd":        {"cicd", "continuous integration", "continuous deployment"},
}


# ── Semantic Matcher (lazy-loaded) ───────────────────────

class SemanticMatcher:
    """Embedding-based skill matcher using sentence-transformers."""

    _instance = None
    _model = None

    @classmethod
    def get_instance(cls) -> "SemanticMatcher":
        """Singleton accessor. Model is loaded only on first use."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_model(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(EMBEDDING_MODEL)

    def similarity(self, text_a: str, text_b: str) -> float:
        """Compute cosine similarity between two text strings."""
        self._load_model()
        embeddings = self._model.encode([text_a, text_b], convert_to_tensor=False)
        from sklearn.metrics.pairwise import cosine_similarity
        score = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        return float(score)

    def similarity_batch(self, query: str, candidates: List[str]) -> List[float]:
        """Compute similarity of one query against multiple candidates."""
        if not candidates:
            return []
        self._load_model()
        all_texts = [query] + candidates
        embeddings = self._model.encode(all_texts, convert_to_tensor=False)
        from sklearn.metrics.pairwise import cosine_similarity
        scores = cosine_similarity([embeddings[0]], embeddings[1:])[0]
        return [float(s) for s in scores]

    def cluster(self, skills: List[str], threshold: float = CLUSTER_THRESHOLD) -> Dict[str, List[str]]:
        """Group skills into clusters using agglomerative clustering."""
        if len(skills) <= 1:
            return {"Core Skills": skills}

        self._load_model()
        embeddings = self._model.encode(skills, convert_to_tensor=False)

        from sklearn.cluster import AgglomerativeClustering
        clustering = AgglomerativeClustering(
            n_clusters=None,
            distance_threshold=1 - threshold,
            metric="cosine",
            linkage="average",
        )
        labels = clustering.fit_predict(embeddings)

        # Group skills by cluster label
        groups: Dict[int, List[str]] = {}
        for skill, label in zip(skills, labels):
            groups.setdefault(label, []).append(skill)

        # Generate category names from clusters
        cluster_names = _generate_cluster_names(groups)
        return {cluster_names[label]: members for label, members in groups.items()}


# Category naming heuristics based on common skill domains
_CATEGORY_KEYWORDS = {
    "Programming Languages": {"python", "java", "c++", "c#", "go", "rust", "javascript", "typescript", "ruby", "php", "swift", "kotlin"},
    "Machine Learning": {"machine learning", "deep learning", "tensorflow", "pytorch", "keras", "scikit-learn", "sklearn", "neural network", "nlp", "computer vision"},
    "Web Development": {"react", "angular", "vue", "node.js", "django", "flask", "html", "css", "express.js", "next.js"},
    "Data Engineering": {"pandas", "numpy", "spark", "hadoop", "sql", "mongodb", "postgresql", "mysql", "redis", "elasticsearch"},
    "Cloud & DevOps": {"aws", "gcp", "azure", "docker", "kubernetes", "ci/cd", "terraform", "jenkins", "linux"},
    "Tools & Frameworks": {"git", "jira", "figma", "postman", "swagger"},
}


def _generate_cluster_names(groups: Dict[int, List[str]]) -> Dict[int, str]:
    """Generate descriptive names for skill clusters."""
    names = {}
    used_names = set()

    for label, members in groups.items():
        member_lower = {m.lower() for m in members}
        best_name = "Other Skills"
        best_overlap = 0

        for cat_name, keywords in _CATEGORY_KEYWORDS.items():
            overlap = len(member_lower & keywords)
            if overlap > best_overlap and cat_name not in used_names:
                best_overlap = overlap
                best_name = cat_name

        if best_overlap == 0 and best_name in used_names:
            best_name = f"Skills ({', '.join(members[:2])})"

        names[label] = best_name
        used_names.add(best_name)

    return names


@dataclass
class ScoredSkill:
    """A skill with its relevance score, match reason, and evidence count."""
    name: str
    score: float
    reason: str
    evidence_count: int = 1


def _normalize(s: str) -> str:
    return s.strip().lower()


def _alias_match(skill: str, target_set: Set[str]) -> bool:
    """Check if skill matches any item via substring + alias lookup."""
    skill_lower = _normalize(skill)

    for target in target_set:
        if skill_lower in target or target in skill_lower:
            return True

    for alias in SKILL_ALIASES.get(skill_lower, set()):
        if alias in target_set:
            return True
        for target in target_set:
            if alias in target or target in alias:
                return True

    return False


def _semantic_match(skill: str, target_set: Set[str], threshold: float = SEMANTIC_THRESHOLD) -> Optional[float]:
    """Check if skill semantically matches any item in target_set using embeddings."""
    if not target_set:
        return None
    try:
        matcher = SemanticMatcher.get_instance()
        targets = list(target_set)
        scores = matcher.similarity_batch(skill, targets)
        max_score = max(scores) if scores else 0.0
        return max_score if max_score >= threshold else None
    except Exception:
        return None


def _skill_in_text(skill: str, text: str) -> bool:
    """Check if skill appears as a whole word in text."""
    pattern = r"\b" + re.escape(_normalize(skill)) + r"\b"
    return bool(re.search(pattern, text.lower()))


def _count_evidence(skill: str, resume: Dict[str, Any]) -> int:
    """Count how many resume sections mention this skill (context-aware scoring)."""
    count = 0
    skill_lower = _normalize(skill)

    for project in resume.get("projects", []):
        desc = project.get("description", "")
        text = " ".join(desc) if isinstance(desc, list) else str(desc)
        tech = " ".join(project.get("tech", project.get("skills", [])))
        if _skill_in_text(skill_lower, text + " " + tech):
            count += 1

    for exp in resume.get("experience", []):
        desc = exp.get("description", "")
        text = " ".join(desc) if isinstance(desc, list) else str(desc)
        exp_skills = " ".join(exp.get("skills", []))
        if _skill_in_text(skill_lower, text + " " + exp_skills):
            count += 1

    return max(count, 1)


def _evidence_boost(evidence_count: int) -> float:
    """Compute score multiplier based on evidence frequency."""
    if evidence_count >= 3:
        return 1.2
    elif evidence_count == 2:
        return 1.1
    return 1.0


def score_skills(
    resume_skills: List[str],
    jd_profile: JDProfile,
    resume: Optional[Dict[str, Any]] = None,
) -> List[ScoredSkill]:
    """
    Score each resume skill for JD relevance.

    Scoring tiers (before evidence boost):
      1.0  — exact required match
      0.8  — exact preferred match
      0.6  — alias/fuzzy match
      0.5  — semantic embedding match (above threshold)
      0.3  — found in JD responsibility text
      0.0  — no match

    If resume dict is provided, scores are boosted by evidence frequency.
    """
    resp_text = " ".join(jd_profile.responsibility_keywords)
    scored: List[ScoredSkill] = []

    for skill in resume_skills:
        skill_lower = _normalize(skill)
        aliases = SKILL_ALIASES.get(skill_lower, set())
        evidence = _count_evidence(skill, resume) if resume else 1
        boost = _evidence_boost(evidence) if resume else 1.0

        if skill_lower in jd_profile.required_skills:
            base_score = 1.0
            reason = "required_exact"
        elif aliases & jd_profile.required_skills:
            base_score = 1.0
            reason = "required_alias"
        elif skill_lower in jd_profile.preferred_skills:
            base_score = 0.8
            reason = "preferred_exact"
        elif aliases & jd_profile.preferred_skills:
            base_score = 0.8
            reason = "preferred_alias"
        elif _alias_match(skill, jd_profile.all_skills):
            base_score = 0.6
            reason = "fuzzy_match"
        else:
            # Try semantic matching via embeddings
            sem_score = _semantic_match(skill, jd_profile.all_skills)
            if sem_score is not None:
                base_score = round(sem_score * 0.7, 2)
                reason = f"semantic ({sem_score:.2f})"
            elif _skill_in_text(skill, resp_text):
                base_score = 0.3
                reason = "in_responsibilities"
            else:
                base_score = 0.0
                reason = "no_match"

        final_score = min(base_score * boost, 1.0)

        if resume and evidence > 1 and base_score > 0:
            reason += f", evidence={evidence}"

        scored.append(ScoredSkill(skill, round(final_score, 2), reason, evidence))

    return scored


def prune_skills(scored_skills: List[ScoredSkill], max_count: int = MAX_SKILLS) -> List[str]:
    """
    Prune skill list to fit within max_count.

    Drops zero-scored first, then lowest-scored, keeping at least MIN_SKILLS.
    """
    if len(scored_skills) <= max_count:
        relevant = [s for s in scored_skills if s.score > 0]
        if len(relevant) >= MIN_SKILLS:
            return [s.name for s in relevant]
        return [s.name for s in scored_skills[:max(max_count, MIN_SKILLS)]]

    by_score = sorted(scored_skills, key=lambda s: s.score, reverse=True)
    keep_count = max(max_count, MIN_SKILLS)
    kept = by_score[:keep_count]

    non_zero = [s for s in kept if s.score > 0]
    if len(non_zero) >= MIN_SKILLS:
        return [s.name for s in non_zero]

    return [s.name for s in kept[:MIN_SKILLS]]


def expand_skills(
    resume: Dict[str, Any],
    jd_profile: JDProfile,
    current_skills: List[str],
) -> List[str]:
    """
    Find JD skills evidenced in resume but not currently listed.

    Only adds skills with direct textual evidence in projects/experience.
    """
    current_lower = {_normalize(s) for s in current_skills}
    current_expanded = set(current_lower)
    for s in current_lower:
        current_expanded.update(SKILL_ALIASES.get(s, set()))

    # Build searchable text from projects + experience
    text_parts: List[str] = []
    for project in resume.get("projects", []):
        desc = project.get("description", "")
        if isinstance(desc, list):
            text_parts.extend(desc)
        elif isinstance(desc, str):
            text_parts.append(desc)
        text_parts.extend(project.get("tech", project.get("skills", [])))

    for exp in resume.get("experience", []):
        desc = exp.get("description", "")
        if isinstance(desc, list):
            text_parts.extend(desc)
        elif isinstance(desc, str):
            text_parts.append(desc)

    searchable_text = " ".join(str(t) for t in text_parts).lower()

    inferred: List[str] = []
    candidates = jd_profile.required_skills | jd_profile.preferred_skills

    for skill in candidates:
        if skill in current_expanded:
            continue

        if _skill_in_text(skill, searchable_text):
            inferred.append(skill.title() if len(skill) > 3 else skill.upper())
            continue

        for alias in SKILL_ALIASES.get(skill, set()):
            if _skill_in_text(alias, searchable_text):
                inferred.append(skill.title() if len(skill) > 3 else skill.upper())
                break

    return inferred


def cluster_skills(skills: List[str]) -> Dict[str, List[str]]:
    """
    Group skills into semantic clusters using embeddings.

    Returns a dict mapping category names to skill lists.
    Falls back to a single flat group if embeddings fail.
    """
    if not skills:
        return {}
    try:
        matcher = SemanticMatcher.get_instance()
        return matcher.cluster(skills)
    except Exception:
        return {"Technical Skills": list(skills)}
