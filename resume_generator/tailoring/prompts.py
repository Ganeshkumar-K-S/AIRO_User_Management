# ──────────────────────────────────────────────────────────
# prompts.py — LLM Prompt Templates
#
# Contains the system prompt (safety guardrails, task spec,
# output format) and the user prompt builder for Groq API
# calls during resume tailoring.
#
# The system prompt enforces:
#   - No fabrication of skills, companies, or metrics
#   - Preserve all factual information
#   - Output strict JSON only
# ──────────────────────────────────────────────────────────

import json
from typing import Dict, Any, List


SYSTEM_PROMPT = """
You are a professional resume tailoring assistant. Your job is to optimize a 
resume JSON for a specific job description while following STRICT rules.

═══════════════════════════════════════════════════════════
ABSOLUTE RULES — violating ANY of these is a FAILURE:
═══════════════════════════════════════════════════════════
1. NEVER invent skills, experiences, companies, or achievements that are NOT 
   present in the original resume.
2. NEVER fabricate metrics, numbers, or quantitative results not in the original.
3. ONLY infer skills that are DIRECTLY evidenced by projects or experience 
   descriptions in the original resume.
4. PRESERVE all factual information: dates, company names, institution names, 
   degrees, GPAs.
5. Do NOT add any project or experience entry that does not exist in the original.
6. Do NOT increase the count of bullet points beyond the original count per item.

═══════════════════════════════════════════════════════════
YOUR TASKS:
═══════════════════════════════════════════════════════════
1. Rewrite "professional_summary" to align with the target role using 
   keywords from the JD. Keep it 2-3 sentences max.
2. Optimize experience and project bullet points:
   - Use JD terminology where it truthfully describes existing work
   - Lead with strong action verbs
   - Keep quantitative results intact
   - Compress verbose bullets; expand thin ones with more detail from context
3. Determine the best "section_order" (list of section keys) based on what 
   the JD emphasizes.
4. For skills_categorized: reorganize categories to highlight JD-relevant 
   groups first. Only include skills from the provided tailored skills list.

═══════════════════════════════════════════════════════════
OUTPUT FORMAT:
═══════════════════════════════════════════════════════════
Return ONLY a valid JSON object with these exact keys:
{
  "professional_summary": "...",
  "experience": [...],
  "projects": [...],
  "skills_categorized": {...},
  "section_order": [...]
}

- No markdown fences, no explanation, no preamble.
- Preserve the EXACT structure of experience/project objects (all original keys).
- section_order values must be from: professional_summary, skills, experience, 
  projects, education, certifications, achievements, publications.
"""


def build_user_prompt(
    resume: Dict[str, Any],
    jd: Dict[str, Any],
    tailored_skills: List[str],
    scored_summary: str,
) -> str:
    """Build the user prompt with resume context, JD, and skill analysis."""

    resume_sections = {}
    for key in [
        "professional_summary", "summary", "skills", "skills_categorized",
        "experience", "projects", "education",
        "certifications", "achievements", "publications",
    ]:
        if key in resume and resume[key]:
            resume_sections[key] = resume[key]

    return f"""\
RESUME (original):
{json.dumps(resume_sections, indent=2)}

JOB DESCRIPTION:
{json.dumps(jd, indent=2)}

SKILL ANALYSIS RESULTS:
{scored_summary}

TAILORED SKILLS LIST (use ONLY these):
{json.dumps(tailored_skills)}

Now produce the optimized JSON. Remember: NO fabrication, preserve facts.
"""
