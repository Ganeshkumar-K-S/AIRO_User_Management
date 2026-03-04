# ──────────────────────────────────────────────────────────
# validators.py — Post-LLM Safety Validators
#
# Validates tailored resume output against the original to
# prevent fabrication. Checks:
#   - No new companies or institutions invented
#   - No new degrees fabricated
#   - Experience/project counts not inflated
#   - Date alterations flagged as warnings
#
# Public API:
#   validate_tailored_resume(original, tailored) → ValidationResult
# ──────────────────────────────────────────────────────────

from dataclasses import dataclass, field
from typing import Dict, Any, List, Set


@dataclass
class ValidationResult:
    """Result of validating a tailored resume against the original."""
    is_valid: bool = True
    violations: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


def _extract_set(items: list, key: str) -> Set[str]:
    """Extract a set of lowercased values for a key from a list of dicts."""
    result = set()
    for item in items:
        if isinstance(item, dict) and key in item:
            result.add(str(item[key]).strip().lower())
    return result


def validate_tailored_resume(
    original: Dict[str, Any],
    tailored: Dict[str, Any],
) -> ValidationResult:
    """
    Validate tailored output against original resume.

    Returns ValidationResult with violations (hard fails)
    and warnings (suspicious but not blocking).
    """
    result = ValidationResult()

    # --- Company fabrication check ---
    orig_companies = _extract_set(original.get("experience", []), "company")
    tail_companies = _extract_set(tailored.get("experience", []), "company")
    fabricated_companies = tail_companies - orig_companies

    if fabricated_companies:
        result.is_valid = False
        result.violations.append(
            f"Fabricated company names: {fabricated_companies}"
        )

    # --- Institution fabrication check ---
    orig_institutions = _extract_set(original.get("education", []), "institution")
    tail_institutions = _extract_set(tailored.get("education", []), "institution")
    fabricated_institutions = tail_institutions - orig_institutions

    if fabricated_institutions:
        result.is_valid = False
        result.violations.append(
            f"Fabricated institution names: {fabricated_institutions}"
        )

    # --- Degree fabrication check ---
    orig_degrees = _extract_set(original.get("education", []), "degree")
    tail_degrees = _extract_set(tailored.get("education", []), "degree")
    fabricated_degrees = tail_degrees - orig_degrees

    if fabricated_degrees:
        result.is_valid = False
        result.violations.append(
            f"Fabricated degree names: {fabricated_degrees}"
        )

    # --- Experience count check ---
    orig_exp_count = len(original.get("experience", []))
    tail_exp_count = len(tailored.get("experience", []))
    if tail_exp_count > orig_exp_count:
        result.is_valid = False
        result.violations.append(
            f"Experience count increased: {orig_exp_count} → {tail_exp_count}"
        )

    # --- Project count check ---
    orig_proj_count = len(original.get("projects", []))
    tail_proj_count = len(tailored.get("projects", []))
    if tail_proj_count > orig_proj_count:
        result.is_valid = False
        result.violations.append(
            f"Project count increased: {orig_proj_count} → {tail_proj_count}"
        )

    # --- Date alteration warning ---
    orig_dates = _extract_set(original.get("experience", []), "duration")
    tail_dates = _extract_set(tailored.get("experience", []), "duration")
    altered_dates = tail_dates - orig_dates
    if altered_dates:
        result.warnings.append(
            f"Experience dates may have been altered: {altered_dates}"
        )

    return result
