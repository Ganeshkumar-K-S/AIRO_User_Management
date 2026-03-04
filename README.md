# AI Resume–JD Gap Analysis & Tailoring Pipeline

This project implements an end‑to‑end AI system that analyzes how well a resume matches a job description and can automatically tailor the resume for that job.
It combines deterministic NLP, semantic embeddings, and LLM reasoning with strict safety validation.

---

# 🔄 Pipeline Overview

````text
                 Resume + JD
                      │
                      ▼
                 jd_parser
                      │
                      ▼
                skill_scorer
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
     gap_analyzer            tailor_engine
          │                       │
          ▼                       ▼
     LLM reasoning          LLM rewrite
          │                       │
          ▼                       ▼
 Gap Analysis JSON          quality_scorer
                                  │
                                  ▼
                               validators
                                  │
                                  ▼
                           Tailored Resume
```text
Resume JSON + Job Description JSON
                │
                ▼
        jd_parser.py
   (JD → structured profile)
                │
                ▼
        skill_scorer.py
   (resume skills vs JD match)
                │
        ┌───────┴────────┐
        ▼                ▼
  gap_analyzer.py   tailor_engine.py
  (gap reasoning)   (resume rewrite)
        │                │
        ▼                ▼
  LLM reasoning     prompts.py
        │                │
        ▼                ▼
 quality_scorer.py  validators.py
        │                │
        └───────┬────────┘
                ▼
            Final Output
   (gap report OR tailored resume)
````

---

# 📦 Module‑wise Inputs & Outputs

Below table shows for each Python file:

* **Left:** What it takes as input
* **Middle:** Module name
* **Right:** What it outputs

---

## jd_parser.py

**Input →** Job description dict
**Module →** `jd_parser.py`
**Output →** Structured `JDProfile`

* Extracts required and preferred skills from JD
* Extracts responsibility keywords
* Detects domain (software / data_science / academic)

---

## skill_scorer.py

**Input →** Resume skills + JDProfile + resume context
**Module →** `skill_scorer.py`
**Output →** Scored skills + inferred skills + clusters

* Scores each resume skill against JD relevance tiers
* Infers missing skills from projects/experience text
* Clusters skills into categories using embeddings

---

## gap_analyzer.py

**Input →** Resume JSON + JD JSON
**Module →** `gap_analyzer.py`
**Output →** Structured gap analysis report

* Computes per‑skill gap scores vs JD
* Calls LLM for alignment and readiness reasoning
* Produces learning recommendations and gap insights

---

## tailor_engine.py

**Input →** Resume JSON + JD JSON + API key
**Module →** `tailor_engine.py`
**Output →** Tailored resume JSON

* Optimizes resume content for JD keywords
* Calls LLM with fallback and safety checks
* Merges rewritten sections with original facts

---

## prompts.py

**Input →** Resume + JD + skill analysis + tailored skills
**Module →** `prompts.py`
**Output →** LLM‑ready prompts

* Defines strict system rules (no fabrication)
* Builds user prompt combining resume + JD context
* Guides LLM resume rewriting structure

---

## quality_scorer.py

**Input →** LLM output + JD keywords + original resume
**Module →** `quality_scorer.py`
**Output →** Quality score + issues

* Measures keyword density and bullet strength
* Detects vague or weak resume bullets
* Computes overall response quality score

---

## validators.py

**Input →** Original resume + tailored resume
**Module →** `validators.py`
**Output →** Validation result

* Ensures no fabricated companies or degrees
* Prevents adding extra projects/experience
* Flags suspicious date changes as warnings

---

# 🧠 End‑to‑End Flow Summary

1. **jd_parser.py** → Understand JD
2. **skill_scorer.py** → Match resume skills to JD
3. **gap_analyzer.py** → Compute gaps & readiness
4. **tailor_engine.py** → Rewrite resume for JD
5. **prompts.py** → Build safe LLM prompts
6. **quality_scorer.py** → Check output quality
7. **validators.py** → Ensure no hallucination

---

# ✅ Outputs Produced

## Gap Analysis

* Readiness score
* Missing required skills
* Learning recommendations
* Domain fit

## Tailored Resume

* Optimized summary
* JD‑aligned bullets
* Clustered skills section
* Best section order

---

# 🏁 Conclusion

This pipeline forms a production‑style AI career system that:

* Understands job requirements
* Quantifies candidate gaps
* Rewrites resumes safely
* Validates AI output quality

It mirrors modern AI resume platforms using deterministic NLP + semantic matching + LLM reasoning with guardrails.
