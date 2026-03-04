# ──────────────────────────────────────────────────────────
# latex_renderer.py — Jinja2 LaTeX Template Renderer
#
# Renders LaTeX templates with profile data. Handles:
#   - LaTeX special character escaping
#   - Profile field normalization (college->institution, etc.)
#   - Missing field defaults
#   - Safe filename generation
#   - Dynamic content fitting (spacing adjustment)
#   - Template theming (color/font injection)
#
# Public API:
#   render_latex(profile, template_name, theme) -> .tex file path
# ──────────────────────────────────────────────────────────

import os
import re
from typing import Dict, Any, Optional
from jinja2 import Environment, FileSystemLoader

# Fields that should NOT be LaTeX-escaped (URLs, emails, links)
SAFE_FIELDS = {"email", "github", "linkedin", "website", "link", "url"}

# LaTeX special characters -> escaped equivalents
LATEX_SPECIAL_CHARS = {
    "&": r"\&",
    "%": r"\%",
    "$": r"\$",
    "#": r"\#",
    "_": r"\_",
    "{": r"\{",
    "}": r"\}",
    "~": r"\textasciitilde{}",
    "^": r"\^{}",
}


def escape_latex(text: str) -> str:
    """Escape LaTeX special characters in text."""
    if not isinstance(text, str):
        return str(text)
    text = text.replace("\\", r"\textbackslash{}")
    for char, escaped in LATEX_SPECIAL_CHARS.items():
        text = text.replace(char, escaped)
    return text


def normalize_profile(profile: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize profile fields to expected template format."""
    normalized = {}
    for key, value in profile.items():
        if key == "education" and isinstance(value, list):
            edu_list = []
            for edu in value:
                if isinstance(edu, dict):
                    edu_copy = edu.copy()
                    if "college" in edu_copy:
                        edu_copy["institution"] = edu_copy.pop("college")
                    edu_list.append(edu_copy)
                else:
                    edu_list.append(edu)
            normalized["education"] = edu_list
        elif key == "certifications" and isinstance(value, list):
            certs = []
            for cert in value:
                if isinstance(cert, str):
                    certs.append({"name": cert})
                else:
                    certs.append(cert)
            normalized["certifications"] = certs
        else:
            normalized[key] = value
    return normalized


def sanitize_profile(data: Any, parent_key: str = "") -> Any:
    """Recursively escape all strings for LaTeX. SAFE_FIELDS are left raw."""
    if isinstance(data, dict):
        return {k: sanitize_profile(v, k) for k, v in data.items()}
    if isinstance(data, list):
        return [sanitize_profile(v, parent_key) for v in data]
    if isinstance(data, str):
        return data if parent_key in SAFE_FIELDS else escape_latex(data)
    return data


def fill_missing_fields(profile: Dict[str, Any]) -> Dict[str, Any]:
    """Fill missing fields with defaults so templates don't error."""
    defaults = {
        "id": "unknown", "name": "Name Not Provided",
        "email": "", "phone": "", "linkedin": "", "github": "",
        "website": "", "professional_summary": "", "career_objective": "",
        "objective": "", "research_interests": "",
        "skills": [], "projects": [], "experience": [],
        "education": [], "publications": [], "certifications": [],
        "achievements": [],
    }
    filled = defaults.copy()
    filled.update(profile)
    return filled


def safe_filename(name: str) -> str:
    """Create OS-safe filename from name."""
    if not name:
        return "Unknown"
    name = re.sub(r"[^A-Za-z0-9 _-]", "", name)
    name = name.strip().replace(" ", "_")
    return name or "Unknown"


def create_jinja_env(templates_dir: str) -> Environment:
    """Create Jinja2 environment configured for LaTeX delimiters."""
    return Environment(
        loader=FileSystemLoader(templates_dir),
        block_start_string="\\BLOCK{",
        block_end_string="}",
        variable_start_string="\\VAR{",
        variable_end_string="}",
        comment_start_string="\\#{",
        comment_end_string="}",
        line_statement_prefix="%%",
        line_comment_prefix="%#",
        trim_blocks=True,
        autoescape=False,
    )


# ── Dynamic Content Fitting (#9) ────────────────────────

def _count_content_items(profile: Dict[str, Any]) -> Dict[str, int]:
    """Count content items to estimate page density."""
    counts = {
        "experience": 0,
        "projects": 0,
        "total_bullets": 0,
        "sections": 0,
    }

    for exp in profile.get("experience", []):
        counts["experience"] += 1
        desc = exp.get("description", "")
        if isinstance(desc, list):
            counts["total_bullets"] += len(desc)
        elif desc:
            counts["total_bullets"] += 1

    for proj in profile.get("projects", []):
        counts["projects"] += 1
        desc = proj.get("description", "")
        if isinstance(desc, list):
            counts["total_bullets"] += len(desc)
        elif desc:
            counts["total_bullets"] += 1

    for section in ["professional_summary", "education", "skills",
                     "certifications", "achievements", "publications"]:
        val = profile.get(section)
        if val and (not isinstance(val, (list, str)) or len(val) > 0):
            counts["sections"] += 1

    return counts


def _compute_spacing(counts: Dict[str, int]) -> Dict[str, str]:
    """
    Compute LaTeX spacing values based on content density.

    Returns spacing values that can be injected into templates:
      - section_vspace: space after section headings
      - item_vspace: space between list items
      - bullet_vspace: space between bullets
      - header_vspace: space after header block
    """
    total_items = counts["experience"] + counts["projects"]
    total_bullets = counts["total_bullets"]

    # Dense content (many items) -> tighter spacing
    # Sparse content (few items) -> looser spacing for better page fill
    if total_bullets > 15 or total_items > 6:
        # Dense: compress
        return {
            "section_vspace": "-8pt",
            "item_vspace": "-2pt",
            "bullet_vspace": "-3pt",
            "header_vspace": "4pt",
            "post_section_vspace": "2pt",
        }
    elif total_bullets < 8 and total_items <= 3:
        # Sparse: expand to fill page
        return {
            "section_vspace": "-4pt",
            "item_vspace": "2pt",
            "bullet_vspace": "0pt",
            "header_vspace": "12pt",
            "post_section_vspace": "8pt",
        }
    else:
        # Normal density
        return {
            "section_vspace": "-6pt",
            "item_vspace": "0pt",
            "bullet_vspace": "-2pt",
            "header_vspace": "8pt",
            "post_section_vspace": "4pt",
        }


# ── Template Theming (#10) ────────────────────────────────

def _resolve_theme(theme: Optional[Dict[str, Any]] = None) -> Dict[str, str]:
    """
    Resolve theme settings with defaults from config.

    Returns dict with:
      - theme_primary_color: hex color for section headings
      - theme_accent_color: hex color for accents
      - theme_font: main document font
    """
    from resume_generator.tailoring.config import THEME_COLORS, THEME_FONT

    resolved = {
        "theme_primary_color": THEME_COLORS.get("primary", "2D3748"),
        "theme_accent_color": THEME_COLORS.get("accent", "3182CE"),
        "theme_font": THEME_FONT,
    }

    if theme:
        if "primary" in theme:
            resolved["theme_primary_color"] = theme["primary"]
        if "accent" in theme:
            resolved["theme_accent_color"] = theme["accent"]
        if "font" in theme:
            resolved["theme_font"] = theme["font"]

    return resolved


def render_latex(
    profile: Dict[str, Any],
    template_name: str,
    theme: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Render a LaTeX template with the given profile.

    Supports dynamic content fitting and optional theme customization.
    Returns path to the generated .tex file.
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    templates_dir = os.path.join(current_dir, "templates")
    output_dir = os.path.join(current_dir, "output")
    os.makedirs(output_dir, exist_ok=True)

    template_file = f"{template_name}.tex"
    template_path = os.path.join(templates_dir, template_file)
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template not found: {template_file}")

    profile = fill_missing_fields(profile)
    profile = normalize_profile(profile)
    sanitized_profile = sanitize_profile(profile)

    # Compute dynamic spacing based on content density
    counts = _count_content_items(profile)
    spacing = _compute_spacing(counts)

    # Resolve theme settings
    theme_vars = _resolve_theme(theme)

    safe_name = safe_filename(profile.get("name", "Unknown"))
    env = create_jinja_env(templates_dir)
    template = env.get_template(template_file)

    # Merge all context: profile + spacing + theme
    context = {**sanitized_profile, **spacing, **theme_vars}
    rendered_tex = template.render(**context)

    output_path = os.path.join(output_dir, f"{safe_name}_Resume.tex")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(rendered_tex)

    return output_path