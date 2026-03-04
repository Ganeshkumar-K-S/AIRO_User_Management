# ──────────────────────────────────────────────────────────
# gap_analyzer.py — Resume vs JD Gap Analysis Agent
#
# AI-powered career reasoning that analyzes resume-JD
# alignment and produces structured guidance:
#   - Quantified per-skill gap scores (not just categories)
#   - Skill match/gap breakdown
#   - Experience alignment assessment
#   - Domain fit analysis
#   - Learning recommendations (prioritized)
#   - Resume improvement advice
#   - Comparative multi-JD analysis
#
# Uses rule-based skill scoring as pre-context, then calls
# Groq LLM for deep semantic reasoning.
#
# Public API:
#   analyze_gap(resume, jd)              -> structured gap dict
#   compare_jds(resume, jds)             -> comparison matrix
#   print_gap_report(analysis)           -> formatted console output
#   print_comparison_matrix(comparison)  -> formatted matrix output
# ──────────────────────────────────────────────────────────

import json
from typing import Dict, Any, Optional, List

from .config import GROQ_API_KEY, GROQ_MODEL, GROQ_MAX_TOKENS
from .jd_parser import parse_jd
from .skill_scorer import score_skills, expand_skills, SemanticMatcher


GAP_ANALYSIS_SYSTEM_PROMPT = """\
You are an AI career reasoning agent integrated into a resume-job matching system.

Your task is to analyze a candidate's Resume JSON against a Job Description (JD) \
JSON and produce a structured gap analysis and improvement guidance.

Your role is NOT to rewrite the resume.
Your role is to REASON about alignment and gaps between the resume and the job.

REASONING RULES
- Use semantic matching (e.g., CNN -> Deep Learning, Flask -> Backend)
- Infer skills from projects logically (e.g., API project -> REST APIs)
- Do NOT assume skills without evidence from the resume
- Do NOT hallucinate experience
- Be conservative in claims

ANALYSIS GUIDELINES

Skill Matching:
- Exact match -> matched_required / matched_preferred
- Related (Flask -> Backend) -> partial
- Absent -> missing

Experience:
- ML internship -> ML experience
- Only coursework -> limited experience

Readiness Score:
- 0-30 -> weak, 30-60 -> moderate, 60-80 -> near ready, 80+ -> strong

Learning Recommendations:
- Only for missing_required or major partial gaps
- Prioritize JD required skills; be actionable

Resume Advice:
- Focus on presentation gaps, not fabrication

IMPORTANT: Output MUST be valid JSON only. No extra text, no markdown.

OUTPUT FORMAT (STRICT JSON)
{
  "match_summary": {
    "overall_alignment": "High | Medium | Low",
    "readiness_score": 0-100,
    "role_fit": "Strong | Moderate | Weak"
  },
  "skills_analysis": {
    "matched_required_skills": [],
    "matched_preferred_skills": [],
    "partial_match_skills": [],
    "missing_required_skills": [],
    "missing_preferred_skills": []
  },
  "experience_analysis": {
    "relevant_experience": [],
    "missing_experience": [],
    "level_assessment": "Below | Near | Meets | Exceeds"
  },
  "domain_analysis": {
    "resume_domain": [],
    "jd_domain": "",
    "domain_match": "High | Medium | Low"
  },
  "gap_insights": [],
  "learning_recommendations": [
    {"skill": "", "reason": "", "priority": "High | Medium | Low"}
  ],
  "resume_improvement_advice": []
}
"""


def _build_gap_analysis_prompt(
    resume: Dict[str, Any],
    jd: Dict[str, Any],
    skill_context: str,
) -> str:
    """Build user prompt with resume, JD, and pre-computed skill analysis."""
    resume_sections = {}
    for key in [
        "name", "summary", "professional_summary",
        "skills", "skills_categorized",
        "experience", "projects", "education",
        "certifications", "achievements", "publications",
    ]:
        if key in resume and resume[key]:
            resume_sections[key] = resume[key]

    return f"""\
RESUME JSON:
{json.dumps(resume_sections, indent=2)}

JOB DESCRIPTION JSON:
{json.dumps(jd, indent=2)}

PRE-COMPUTED SKILL SCORING:
{skill_context}

Analyze the resume against the job description.
Produce the gap analysis JSON as specified. Return ONLY the JSON object.
"""


def _compute_skill_gap_scores(
    resume: Dict[str, Any],
    jd_profile,
) -> List[Dict[str, Any]]:
    """
    Compute quantified gap scores for each JD skill.

    For each required/preferred skill in the JD, computes:
      - gap: 0.0 (no gap, skill fully present) to 1.0 (completely missing)
      - evidence: what in the resume supports this skill
      - tier: required or preferred
    """
    resume_skills = resume.get("skills", [])
    scored = score_skills(resume_skills, jd_profile, resume=resume)
    scored_map = {s.name.lower(): s for s in scored}

    gap_scores = []

    all_jd_skills = [
        (skill, "required") for skill in jd_profile.required_skills
    ] + [
        (skill, "preferred") for skill in jd_profile.preferred_skills
    ]

    # Try using semantic matcher for unmatched skills
    try:
        matcher = SemanticMatcher.get_instance()
        has_embeddings = True
    except Exception:
        has_embeddings = False

    for jd_skill, tier in all_jd_skills:
        jd_lower = jd_skill.lower()

        # Check if directly in resume skills
        if jd_lower in scored_map:
            s = scored_map[jd_lower]
            gap = round(1.0 - s.score, 2)
            evidence = f"Listed in skills (score={s.score}, {s.reason})"
            if s.evidence_count > 1:
                evidence += f", appears in {s.evidence_count} sections"
        elif has_embeddings:
            # Semantic similarity against all resume skills
            similarities = matcher.similarity_batch(jd_skill, resume_skills)
            best_idx = max(range(len(similarities)), key=lambda i: similarities[i]) if similarities else -1
            best_score = similarities[best_idx] if best_idx >= 0 else 0.0

            if best_score >= 0.5:
                gap = round(1.0 - best_score, 2)
                evidence = f"Similar to '{resume_skills[best_idx]}' (similarity={best_score:.2f})"
            else:
                # Check in project/experience text
                evidence_text = _find_skill_evidence(jd_skill, resume)
                if evidence_text:
                    gap = 0.5
                    evidence = f"Mentioned in: {evidence_text}"
                else:
                    gap = 1.0
                    evidence = "Not found in resume"
        else:
            evidence_text = _find_skill_evidence(jd_skill, resume)
            if evidence_text:
                gap = 0.5
                evidence = f"Mentioned in: {evidence_text}"
            else:
                gap = 1.0
                evidence = "Not found in resume"

        gap_scores.append({
            "skill": jd_skill,
            "tier": tier,
            "gap": gap,
            "evidence": evidence,
        })

    return sorted(gap_scores, key=lambda x: (-x["gap"], x["tier"]))


def _find_skill_evidence(skill: str, resume: Dict[str, Any]) -> Optional[str]:
    """Search for skill mentions in resume projects/experience."""
    skill_lower = skill.lower()

    for project in resume.get("projects", []):
        desc = project.get("description", "")
        text = " ".join(desc) if isinstance(desc, list) else str(desc)
        if skill_lower in text.lower():
            return f"Project: {project.get('name', 'unnamed')}"
        for s in project.get("skills", project.get("tech", [])):
            if skill_lower in s.lower():
                return f"Project skills: {project.get('name', 'unnamed')}"

    for exp in resume.get("experience", []):
        desc = exp.get("description", "")
        text = " ".join(desc) if isinstance(desc, list) else str(desc)
        if skill_lower in text.lower():
            return f"Experience: {exp.get('role', 'unnamed')}"

    return None


def analyze_gap(
    resume: Dict[str, Any],
    jd: Dict[str, Any],
    api_key: Optional[str] = None,
    model: Optional[str] = None,
    verbose: bool = True,
) -> Dict[str, Any]:
    """
    Analyze the gap between a resume and a job description.

    Returns structured gap analysis with quantified per-skill gap scores,
    match assessment, and actionable recommendations.
    """
    key = api_key or GROQ_API_KEY
    if not key:
        raise ValueError("Groq API key required. Set GROQ_API_KEY env var or pass api_key.")

    chosen_model = model or GROQ_MODEL

    # Pre-compute skill scoring
    if verbose:
        print("[PARSE] Parsing job description...")
    jd_profile = parse_jd(jd)
    if verbose:
        print(f"   Role:   {jd_profile.role}")
        print(f"   Domain: {jd_profile.domain}")

    resume_skills = resume.get("skills", [])
    scored = score_skills(resume_skills, jd_profile, resume=resume)

    skill_lines = []
    for s in scored:
        tag = "[MATCH]  " if s.score >= 0.6 else ("[PARTIAL]" if s.score > 0 else "[MISS]   ")
        skill_lines.append(f"  {tag} {s.name}: {s.score} ({s.reason})")

    current_skills = [s.name for s in scored if s.score > 0]
    inferred = expand_skills(resume, jd_profile, current_skills)
    if inferred:
        skill_lines.append(f"\n  Inferable from projects/experience: {inferred}")

    skill_context = "\n".join(skill_lines)
    if verbose:
        print("\n[SCORE] Skill scoring complete.")
        print(skill_context)

    # Compute quantified gap scores
    if verbose:
        print("\n[GAP] Computing quantified skill gaps...")
    gap_scores = _compute_skill_gap_scores(resume, jd_profile)
    if verbose:
        for gs in gap_scores:
            level = "FULL" if gs["gap"] >= 0.9 else ("PARTIAL" if gs["gap"] > 0.2 else "COVERED")
            print(f"   [{level:7s}] {gs['skill']:20s} gap={gs['gap']:.2f} ({gs['tier']}) - {gs['evidence']}")

    # Call LLM
    if verbose:
        print(f"\n[LLM] Calling Groq ({chosen_model}) for gap analysis...")

    from .tailor_engine import _call_with_fallback

    user_prompt = _build_gap_analysis_prompt(resume, jd, skill_context)

    result = _call_with_fallback(
        GAP_ANALYSIS_SYSTEM_PROMPT, user_prompt, key,
        primary_model=chosen_model, verbose=verbose,
    )

    if result is None:
        if verbose:
            print("   WARNING: All models failed for gap analysis.")
        raise RuntimeError("All LLM models failed for gap analysis")

    # Enrich with quantified gap scores
    result["skill_gap_scores"] = gap_scores

    if verbose:
        print("   Gap analysis complete.")
    return result


def compare_jds(
    resume: Dict[str, Any],
    jds: List[Dict[str, Any]],
    api_key: Optional[str] = None,
    model: Optional[str] = None,
    verbose: bool = True,
) -> Dict[str, Any]:
    """
    Compare resume against multiple JDs and produce a comparison matrix.

    Returns a dict with per-JD analysis and a summary matrix.
    """
    results = []

    for i, jd in enumerate(jds):
        role = jd.get("role", f"Role {i+1}")
        if verbose:
            print(f"\n{'=' * 60}")
            print(f"  Analyzing: {role} ({i+1}/{len(jds)})")
            print(f"{'=' * 60}")

        try:
            gap = analyze_gap(resume, jd, api_key=api_key, model=model, verbose=verbose)
            summary = gap.get("match_summary", {})
            results.append({
                "role": role,
                "readiness_score": summary.get("readiness_score", 0),
                "alignment": summary.get("overall_alignment", "Unknown"),
                "role_fit": summary.get("role_fit", "Unknown"),
                "missing_required": len(gap.get("skills_analysis", {}).get("missing_required_skills", [])),
                "missing_preferred": len(gap.get("skills_analysis", {}).get("missing_preferred_skills", [])),
                "full_analysis": gap,
            })
        except Exception as e:
            if verbose:
                print(f"   ERROR: Failed for {role}: {e}")
            results.append({
                "role": role,
                "readiness_score": 0,
                "alignment": "Error",
                "role_fit": "Error",
                "missing_required": -1,
                "missing_preferred": -1,
                "error": str(e),
            })

    # Sort by readiness score (best fit first)
    results.sort(key=lambda x: x["readiness_score"], reverse=True)

    return {
        "candidate": resume.get("name", "Unknown"),
        "roles_analyzed": len(jds),
        "best_fit": results[0]["role"] if results else "N/A",
        "comparison": results,
    }


def print_gap_report(analysis: Dict[str, Any]) -> None:
    """Print a formatted gap analysis report to the console."""
    print("\n" + "=" * 60)
    print("  GAP ANALYSIS REPORT")
    print("=" * 60)

    summary = analysis.get("match_summary", {})
    print(f"\n  Overall Alignment : {summary.get('overall_alignment', 'N/A')}")
    print(f"  Readiness Score   : {summary.get('readiness_score', 'N/A')}/100")
    print(f"  Role Fit          : {summary.get('role_fit', 'N/A')}")

    # Quantified gap scores
    gap_scores = analysis.get("skill_gap_scores", [])
    if gap_scores:
        print("\n  QUANTIFIED SKILL GAPS")
        for gs in gap_scores:
            bar_len = int(gs["gap"] * 20)
            bar = "#" * bar_len + "." * (20 - bar_len)
            print(f"   {gs['skill']:20s} [{bar}] {gs['gap']:.2f} ({gs['tier']})")

    skills = analysis.get("skills_analysis", {})
    print("\n  SKILLS ANALYSIS")
    print(f"   [MATCH]   Matched Required  : {skills.get('matched_required_skills', [])}")
    print(f"   [MATCH]   Matched Preferred : {skills.get('matched_preferred_skills', [])}")
    print(f"   [PARTIAL] Partial Matches   : {skills.get('partial_match_skills', [])}")
    print(f"   [MISS]    Missing Required  : {skills.get('missing_required_skills', [])}")
    print(f"   [MISS]    Missing Preferred : {skills.get('missing_preferred_skills', [])}")

    exp = analysis.get("experience_analysis", {})
    print(f"\n  EXPERIENCE")
    print(f"   Level Assessment: {exp.get('level_assessment', 'N/A')}")
    for r in exp.get("relevant_experience", []):
        print(f"   [+] {r}")
    for m in exp.get("missing_experience", []):
        print(f"   [-] {m}")

    domain = analysis.get("domain_analysis", {})
    print(f"\n  DOMAIN")
    print(f"   Resume Domains : {domain.get('resume_domain', [])}")
    print(f"   JD Domain      : {domain.get('jd_domain', 'N/A')}")
    print(f"   Match          : {domain.get('domain_match', 'N/A')}")

    gaps = analysis.get("gap_insights", [])
    if gaps:
        print("\n  KEY GAPS")
        for i, gap in enumerate(gaps, 1):
            print(f"   {i}. {gap}")

    recs = analysis.get("learning_recommendations", [])
    if recs:
        print("\n  LEARNING RECOMMENDATIONS")
        for rec in recs:
            if isinstance(rec, dict):
                priority = rec.get("priority", "")
                print(f"   [{priority}] {rec.get('skill', '')}: {rec.get('reason', '')}")
            else:
                print(f"   - {rec}")

    advice = analysis.get("resume_improvement_advice", [])
    if advice:
        print("\n  RESUME IMPROVEMENT ADVICE")
        for i, a in enumerate(advice, 1):
            print(f"   {i}. {a}")

    print("\n" + "=" * 60)


def print_comparison_matrix(comparison: Dict[str, Any]) -> None:
    """Print a formatted comparison matrix across multiple JDs."""
    print("\n" + "=" * 70)
    print(f"  ROLE COMPARISON MATRIX — {comparison.get('candidate', 'Unknown')}")
    print("=" * 70)
    print(f"\n  Roles analyzed : {comparison.get('roles_analyzed', 0)}")
    print(f"  Best fit       : {comparison.get('best_fit', 'N/A')}")

    print(f"\n  {'Role':<30s} {'Score':>6s}  {'Alignment':<10s} {'Fit':<10s} {'Missing':>8s}")
    print("  " + "-" * 66)

    for item in comparison.get("comparison", []):
        if "error" in item:
            print(f"  {item['role']:<30s} {'ERR':>6s}  {'Error':<10s} {'Error':<10s} {'-':>8s}")
        else:
            missing = item["missing_required"]
            print(
                f"  {item['role']:<30s} "
                f"{item['readiness_score']:>5d}%  "
                f"{item['alignment']:<10s} "
                f"{item['role_fit']:<10s} "
                f"{missing:>8d}"
            )

    print("\n" + "=" * 70)
