# ──────────────────────────────────────────────────────────
# tailor_engine.py — Resume Tailoring Orchestrator
#
# Main pipeline that coordinates:
#   1. JD parsing       -> structured JDProfile
#   2. Skill scoring    -> tiered + semantic relevance scores
#   3. Skill pruning    -> fit within page density
#   4. Skill expansion  -> evidence-based inference
#   5. Skill clustering -> auto-categorize for resume
#   6. Prompt building  -> system + user prompts
#   7. Groq API call    -> LLM-powered rewriting
#   8. Quality scoring  -> keyword density + bullet quality
#   9. Validation       -> safety checks against original
#  10. Merge            -> combine LLM output with original
#
# Features multi-model fallback chain and quality scoring.
# Falls back to rule-based tailoring if all models fail.
#
# Public API:
#   tailor_resume(resume, jd, api_key, model, verbose) -> dict
# ──────────────────────────────────────────────────────────

import json
import time
from typing import Dict, Any, List, Optional

from groq import Groq

from .config import (
    GROQ_API_KEY, GROQ_MODEL, GROQ_TEMPERATURE,
    GROQ_MAX_TOKENS, GROQ_MAX_RETRIES, GROQ_FALLBACK_MODELS,
)
from .jd_parser import parse_jd
from .skill_scorer import score_skills, prune_skills, expand_skills, cluster_skills
from .prompts import SYSTEM_PROMPT, build_user_prompt
from .validators import validate_tailored_resume
from .quality_scorer import score_response_quality, detect_vague_bullets


def _parse_json_response(text: str) -> Dict[str, Any]:
    """Parse JSON from LLM response, handling markdown fences."""
    text = text.strip()

    # Strip markdown fences
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines)

    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try extracting JSON object
    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > start:
        return json.loads(text[start:end])

    raise json.JSONDecodeError("No valid JSON found", text, 0)


def _call_groq(
    system_prompt: str,
    user_prompt: str,
    api_key: str,
    model: str = GROQ_MODEL,
    temperature: float = GROQ_TEMPERATURE,
    max_tokens: int = GROQ_MAX_TOKENS,
) -> Dict[str, Any]:
    """Call Groq API with retry logic. Returns parsed JSON dict."""
    client = Groq(api_key=api_key)
    last_error = None

    for attempt in range(GROQ_MAX_RETRIES + 1):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            content = response.choices[0].message.content
            return _parse_json_response(content)

        except Exception as e:
            last_error = e
            if attempt < GROQ_MAX_RETRIES:
                time.sleep(2 ** attempt)

    raise RuntimeError(f"Groq API failed after {GROQ_MAX_RETRIES + 1} attempts: {last_error}")


def _call_with_fallback(
    system_prompt: str,
    user_prompt: str,
    api_key: str,
    primary_model: str,
    verbose: bool = True,
) -> Optional[Dict[str, Any]]:
    """Try primary model, then each fallback model in chain."""
    models_to_try = [primary_model] + GROQ_FALLBACK_MODELS

    for i, model in enumerate(models_to_try):
        label = "primary" if i == 0 else f"fallback-{i}"
        if verbose:
            print(f"\n[LLM] Calling Groq ({model}) [{label}]...")
        try:
            result = _call_groq(system_prompt, user_prompt, api_key, model=model)
            if verbose:
                print(f"   Response received from {model}.")
            return result
        except RuntimeError as e:
            if verbose:
                print(f"   WARNING: {model} failed: {e}")

    return None


def _merge_tailored(
    original: Dict[str, Any],
    llm_output: Dict[str, Any],
    tailored_skills: List[str],
) -> Dict[str, Any]:
    """Merge LLM output with original profile, preserving identity fields."""
    merged = original.copy()

    # Overwrite LLM-managed fields
    for key in ["professional_summary", "experience", "projects", "skills_categorized", "section_order"]:
        if key in llm_output:
            merged[key] = llm_output[key]

    # Skills from rule engine (not LLM)
    merged["skills"] = tailored_skills

    return merged


def _rule_based_fallback(
    original: Dict[str, Any],
    tailored_skills: List[str],
) -> Dict[str, Any]:
    """Fallback when LLM fails: original + rule-pruned skills + auto-clustered."""
    result = original.copy()
    result["skills"] = tailored_skills

    # Auto-cluster skills even in fallback
    try:
        result["skills_categorized"] = cluster_skills(tailored_skills)
    except Exception:
        pass

    return result


def tailor_resume(
    resume: Dict[str, Any],
    jd: Dict[str, Any],
    api_key: Optional[str] = None,
    model: Optional[str] = None,
    verbose: bool = True,
) -> Dict[str, Any]:
    """
    Tailor a resume for a specific JD.

    Combines rule-based skill scoring with LLM-powered content rewriting.
    Falls back to rule-based only if all models fail or output is invalid.
    """
    key = api_key or GROQ_API_KEY
    if not key:
        raise ValueError("Groq API key required. Set GROQ_API_KEY env var or pass api_key.")

    chosen_model = model or GROQ_MODEL

    # Step 1: Parse JD
    if verbose:
        print("[PARSE] Parsing job description...")
    jd_profile = parse_jd(jd)
    if verbose:
        print(f"   Role:      {jd_profile.role}")
        print(f"   Domain:    {jd_profile.domain}")
        print(f"   Required:  {jd_profile.required_skills}")
        print(f"   Preferred: {jd_profile.preferred_skills}")

    # Step 2: Score skills (with context-aware + semantic matching)
    resume_skills = resume.get("skills", [])
    scored = score_skills(resume_skills, jd_profile, resume=resume)
    if verbose:
        print("\n[SCORE] Scoring skills (semantic + context-aware)...")
        for s in scored:
            tag = "[MATCH]  " if s.score >= 0.6 else ("[PARTIAL]" if s.score > 0 else "[MISS]   ")
            evidence_note = f" [x{s.evidence_count}]" if s.evidence_count > 1 else ""
            print(f"   {tag} {s.name}: {s.score} ({s.reason}){evidence_note}")

    # Step 3: Prune + expand
    pruned = prune_skills(scored)
    inferred = expand_skills(resume, jd_profile, pruned)
    tailored_skills = pruned + inferred

    if verbose:
        print("\n[PRUNE] Pruning and expanding skills...")
        if inferred:
            print(f"   Inferred from projects/experience: {inferred}")
        print(f"   Final skills ({len(tailored_skills)}): {tailored_skills}")

    # Step 4: Auto-cluster skills
    if verbose:
        print("\n[CLUSTER] Grouping skills into categories...")
    clustered = cluster_skills(tailored_skills)
    if verbose:
        for cat, members in clustered.items():
            print(f"   {cat}: {members}")

    # Step 5: Build prompts
    scored_summary = "\n".join(
        f"  {s.name}: {s.score} ({s.reason})" for s in scored
    )
    user_prompt = build_user_prompt(resume, jd, tailored_skills, scored_summary)

    # Step 6: Call LLM with multi-model fallback
    llm_output = _call_with_fallback(
        SYSTEM_PROMPT, user_prompt, key,
        primary_model=chosen_model, verbose=verbose,
    )

    if llm_output is None:
        if verbose:
            print("   All models failed. Using rule-based fallback.")
        return _rule_based_fallback(resume, tailored_skills)

    # Step 7: Quality scoring
    if verbose:
        print("\n[QUALITY] Scoring response quality...")
    jd_keywords = jd_profile.required_skills | jd_profile.preferred_skills
    quality = score_response_quality(llm_output, jd_keywords, resume)

    if verbose:
        print(f"   Quality score:   {quality.overall_score:.3f}")
        print(f"   Keyword density: {quality.keyword_density:.1%}")
        print(f"   Avg bullet len:  {quality.avg_bullet_length:.0f} words")
        print(f"   Strong verbs:    {quality.strong_verb_ratio:.0%}")
        if quality.vague_bullet_count > 0:
            print(f"   Vague bullets:   {quality.vague_bullet_count}/{quality.total_bullet_count}")
        if quality.issues:
            for issue in quality.issues:
                print(f"   WARNING: {issue}")

    if not quality.is_acceptable:
        if verbose:
            print(f"   Quality below threshold. Using rule-based fallback.")
        return _rule_based_fallback(resume, tailored_skills)

    # Step 8: Safety validation
    if verbose:
        print("\n[VALIDATE] Validating tailored output...")

    validation = validate_tailored_resume(resume, llm_output)
    if not validation.is_valid:
        if verbose:
            print(f"   WARNING: Validation failed: {validation.violations}")
            print("   Using rule-based fallback.")
        return _rule_based_fallback(resume, tailored_skills)

    if validation.warnings and verbose:
        for w in validation.warnings:
            print(f"   WARNING: {w}")

    # Step 9: Merge and return
    result = _merge_tailored(resume, llm_output, tailored_skills)

    # Override skills_categorized with auto-clustered version if LLM didn't provide good one
    if "skills_categorized" not in llm_output or not llm_output["skills_categorized"]:
        result["skills_categorized"] = clustered

    if verbose:
        print("\n[DONE] Tailoring complete.")
    return result
