# ──────────────────────────────────────────────────────────
# generator.py — Resume Generator Orchestrator
#
# Main entry point for generating resumes. Coordinates:
#   1. Template selection (template_selector.py)
#   2. LaTeX rendering   (latex_renderer.py)
#   3. PDF compilation    (pdf_generator.py)
#
# Public API:
#   generate_resume()          — single resume from profile dict
#   generate_resume_batch()    — batch of resumes from list of profiles
#   generate_tailored_resume() — JD-aware tailored resume via LLM
# ──────────────────────────────────────────────────────────

import os
from typing import Dict, Any, Tuple, List

try:
    from .template_selector import select_template
    from .latex_renderer import render_latex
    from .pdf_generator import compile_pdf, verify_pdf
except ImportError:
    from template_selector import select_template
    from latex_renderer import render_latex
    from pdf_generator import compile_pdf, verify_pdf


def generate_resume(
    profile: Dict[str, Any],
    template_name: str | None = None,
    engine: str = "xelatex",
    verbose: bool = True,
) -> Tuple[str, str]:
    """
    Generate resume PDF from profile.

    Args:
        profile: User profile dictionary (must have 'name')
        template_name: Optional template override
        engine: LaTeX engine (xelatex/pdflatex)
        verbose: Print progress logs

    Returns:
        (pdf_path, template_name)
    """
    if not isinstance(profile, dict) or not profile:
        raise ValueError("Profile must be a non-empty dictionary")

    if not profile.get("name"):
        raise ValueError("Profile must contain a 'name' field")

    user_id = profile.get("id", "unknown")

    # Template selection
    if template_name is None:
        if verbose:
            print(f" [{user_id}] Analyzing profile...")
        template_name = select_template(profile)

    if verbose:
        print(f" [{user_id}] Template: {template_name}")

    # Render LaTeX
    if verbose:
        print(f" [{user_id}] Rendering LaTeX...")

    try:
        tex_path = render_latex(profile, template_name)
    except Exception as e:
        raise RuntimeError(f"LaTeX rendering failed ({user_id}): {e}") from e

    if verbose:
        print(f" [{user_id}] TEX: {os.path.basename(tex_path)}")

    # Compile PDF
    if verbose:
        print(f" [{user_id}] Compiling PDF...")

    try:
        pdf_path = compile_pdf(tex_path, engine=engine, cleanup=True)
    except Exception as e:
        raise RuntimeError(f"PDF compilation failed ({user_id}): {e}") from e

    # Verify
    if not verify_pdf(pdf_path):
        raise RuntimeError(f"Generated PDF invalid ({user_id}): {pdf_path}")

    if verbose:
        print(f"[{user_id}] PDF: {os.path.basename(pdf_path)}")

    return pdf_path, template_name


def generate_resume_batch(
    profiles: List[Dict[str, Any]],
    engine: str = "xelatex",
    verbose: bool = True,
) -> Dict[str, Tuple[str, str]]:
    """
    Generate resumes for multiple profiles.

    Args:
        profiles: List of profile dicts
        engine: LaTeX engine
        verbose: Print logs

    Returns:
        {user_id: (pdf_path, template)}
    """
    if not isinstance(profiles, list):
        raise ValueError("profiles must be a list")

    results: Dict[str, Tuple[str, str]] = {}
    errors: Dict[str, str] = {}
    total = len(profiles)

    if verbose:
        print(f"\n Batch processing {total} profiles\n")

    for i, profile in enumerate(profiles, 1):
        if not isinstance(profile, dict):
            errors[f"invalid_{i}"] = "Profile not dict"
            continue

        user_id = profile.get("id", f"unknown_{i}")
        if verbose:
            print(f"\n[{i}/{total}] {user_id}")

        try:
            pdf_path, template = generate_resume(profile, engine=engine, verbose=verbose)
            results[user_id] = (pdf_path, template)
        except Exception as e:
            errors[user_id] = str(e)
            if verbose:
                print(f"  FAILED {user_id}: {e}")

    if verbose:
        print("\n" + "=" * 60)
        print(f" Success: {len(results)}")
        print(f" Failed:  {len(errors)}")
        if errors:
            print("\nErrors:")
            for uid, err in errors.items():
                print(f"  - {uid}: {err}")

    return results


def generate_tailored_resume(
    profile: Dict[str, Any],
    jd: Dict[str, Any],
    api_key: str | None = None,
    model: str | None = None,
    template_name: str | None = None,
    engine: str = "xelatex",
    verbose: bool = True,
) -> Tuple[str, str, Dict[str, Any]]:
    """
    Generate a JD-tailored resume PDF.

    Runs the tailoring engine first (Groq LLM + rule-based scoring),
    then feeds the tailored profile into the standard pipeline.

    Args:
        profile: User profile dictionary
        jd: Job description dictionary
        api_key: Groq API key (or set GROQ_API_KEY env var)
        model: Groq model name override
        template_name: Optional template override
        engine: LaTeX engine (xelatex/pdflatex)
        verbose: Print progress logs

    Returns:
        (pdf_path, template_name, tailored_profile)
    """
    try:
        from .tailoring import tailor_resume
    except ImportError:
        from tailoring import tailor_resume

    if verbose:
        print("=" * 60)
        print("  TAILORED RESUME GENERATION")
        print("=" * 60)

    tailored_profile = tailor_resume(
        profile, jd, api_key=api_key, model=model, verbose=verbose
    )

    if verbose:
        print("\n" + "=" * 60)
        print("  Generating PDF from tailored profile...")
        print("=" * 60)

    pdf_path, template = generate_resume(
        tailored_profile, template_name=template_name,
        engine=engine, verbose=verbose,
    )

    return pdf_path, template, tailored_profile