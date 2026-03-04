# ──────────────────────────────────────────────────────────
# pdf_generator.py — LaTeX to PDF Compiler
#
# Compiles .tex files into PDFs using XeLaTeX (or pdflatex).
# Handles compilation retry, cleanup of temp files, and
# basic PDF header validation.
#
# Public API:
#   compile_pdf(tex_path) → pdf_path string
#   verify_pdf(pdf_path)  → bool
# ──────────────────────────────────────────────────────────

import os
import subprocess
import shutil


def compile_pdf(tex_path: str, engine="xelatex", cleanup=True, timeout=60) -> str:
    """Compile .tex to .pdf. Runs engine twice for cross-references."""
    if not shutil.which(engine):
        raise RuntimeError(f"{engine} not found. Install LaTeX.")

    if not os.path.exists(tex_path):
        raise FileNotFoundError(tex_path)

    tex_dir = os.path.dirname(os.path.abspath(tex_path))
    pdf_path = os.path.join(tex_dir, os.path.basename(tex_path).replace(".tex", ".pdf"))
    cmd = [engine, "-interaction=nonstopmode", "-output-directory", tex_dir, tex_path]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        if result.returncode != 0:
            raise RuntimeError(result.stderr)
        # Second pass for cross-references
        subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        raise RuntimeError("LaTeX compilation timed out")

    if not os.path.exists(pdf_path):
        raise RuntimeError("PDF not generated")

    if cleanup:
        for ext in [".aux", ".log", ".out", ".toc"]:
            f = tex_path.replace(".tex", ext)
            if os.path.exists(f):
                os.remove(f)

    return pdf_path


def verify_pdf(pdf_path: str) -> bool:
    """Check that PDF exists, is non-empty, and has a valid header."""
    if not os.path.exists(pdf_path):
        return False
    if os.path.getsize(pdf_path) < 100:
        return False
    try:
        with open(pdf_path, "rb") as f:
            return f.read(4) == b"%PDF"
    except Exception:
        return False
