# ──────────────────────────────────────────────────────────
# __init__.py — Resume Generator Package
#
# Public API for the resume generation system:
#   generate_resume()          — single resume PDF from profile
#   generate_resume_batch()    — batch PDF generation
#   generate_tailored_resume() — JD-aware tailored resume (LLM)
#   tailor_resume()            — tailor JSON without PDF compilation
#   analyze_gap()              — resume vs JD gap analysis (LLM)
#   print_gap_report()         — pretty-print gap analysis results
# ──────────────────────────────────────────────────────────

from .generator import generate_resume, generate_resume_batch, generate_tailored_resume
from .template_selector import select_template
from .latex_renderer import render_latex
from .pdf_generator import compile_pdf
from .tailoring import tailor_resume, analyze_gap, print_gap_report

__version__ = "2.1.0"
__all__ = [
    "generate_resume",
    "generate_resume_batch",
    "generate_tailored_resume",
    "tailor_resume",
    "analyze_gap",
    "print_gap_report",
    "select_template",
    "render_latex",
    "compile_pdf",
]
