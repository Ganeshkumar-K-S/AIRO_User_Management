import re
import spacy
from sentence_transformers import SentenceTransformer, util

# Load NLP models once
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Downloading en_core_web_sm...")
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

try:
    model = SentenceTransformer("all-MiniLM-L6-v2")
except Exception:
    import os
    os.environ["TOKENIZERS_PARALLELISM"] = "false"
    model = SentenceTransformer("all-MiniLM-L6-v2")

############################################################
# -------------------- COMMON UTILS ----------------------- #
############################################################

def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
    return text


def extract_noun_keywords(text: str):
    doc = nlp(clean_text(text))
    keywords = set()

    for token in doc:
        if token.pos_ in ["NOUN", "PROPN"] and not token.is_stop:
            keywords.add(token.lemma_)

    return keywords


############################################################
# ---------------- ATS WITH JD SECTION -------------------- #
############################################################

def weighted_keyword_score(jd_keywords: dict, resume_text: str):
    """
    jd_keywords example:
    {
        "python": 5,
        "machine learning": 5,
        "sql": 3,
        "communication": 1
    }
    """

    resume_text = clean_text(resume_text)

    total_weight = sum(jd_keywords.values())
    matched_weight = 0
    matched_keywords = []

    for keyword, weight in jd_keywords.items():
        if keyword.lower() in resume_text:
            matched_weight += weight
            matched_keywords.append(keyword)

    score = (matched_weight / total_weight) * 100 if total_weight else 0

    return round(score, 2), matched_keywords


def semantic_similarity_score(jd_text: str, resume_text: str):
    emb1 = model.encode(jd_text, convert_to_tensor=True)
    emb2 = model.encode(resume_text, convert_to_tensor=True)

    similarity = util.cos_sim(emb1, emb2).item()

    return round(similarity * 100, 2)


def section_wise_heatmap(jd_keywords: dict, resume_sections: dict):
    heatmap = {}
    total_weight = sum(jd_keywords.values())

    for section, text in resume_sections.items():
        text = clean_text(text)
        matched_weight = 0

        for keyword, weight in jd_keywords.items():
            if keyword.lower() in text:
                matched_weight += weight

        coverage = (matched_weight / total_weight) * 100 if total_weight else 0
        heatmap[section] = round(coverage, 2)

    return heatmap


def ats_with_jd(jd_text: str, jd_keywords: dict, resume_sections: dict):
    full_resume_text = " ".join(str(v) for v in resume_sections.values())

    # 1. Weighted Keyword Score
    keyword_score, matched_keywords = weighted_keyword_score(
        jd_keywords, full_resume_text
    )

    # 2. Semantic Similarity Score
    semantic_score = semantic_similarity_score(jd_text, full_resume_text)

    # 3. Section-wise Heatmap
    heatmap = section_wise_heatmap(jd_keywords, resume_sections)

    # 4. Final Score (Hybrid Formula)
    final_score = (
        0.6 * keyword_score +
        0.3 * semantic_score +
        0.1 * (sum(heatmap.values()) / len(heatmap)) if len(heatmap) > 0 else 0
    )

    # 5. Skill Gap Detection
    missing_keywords = list(set(jd_keywords.keys()) - set(matched_keywords))

    return {
        "ATS_score_with_JD": round(final_score, 2),
        "keyword_score": keyword_score,
        "semantic_score": semantic_score,
        "heatmap": heatmap,
        "missing_keywords": missing_keywords
    }


############################################################
# --------------- ATS WITHOUT JD SECTION ------------------ #
############################################################

ACTION_VERBS = [
    "developed", "implemented", "designed",
    "optimized", "built", "led",
    "analyzed", "created", "engineered",
    "managed", "improved"
]


def check_sections(resume_text):
    required = ["summary", "skills", "projects", "experience", "education"]
    score = 0

    for section in required:
        if section in resume_text.lower():
            score += 4  # 5 sections × 4 = 20

    return score


def contact_score(resume_text):
    email_pattern = r'\S+@\S+'
    phone_pattern = r'\b\d{10}\b'

    score = 0

    if re.search(email_pattern, resume_text):
        score += 5
    if re.search(phone_pattern, resume_text):
        score += 5

    return score


def bullet_score(resume_text):
    bullets = resume_text.count("•") + resume_text.count("-")

    if bullets >= 8:
        return 15
    elif bullets >= 4:
        return 8
    return 0


def action_verb_score(resume_text):
    count = 0

    for verb in ACTION_VERBS:
        if verb in resume_text.lower():
            count += 1

    return min(count * 2, 15)


def length_score(resume_text):
    word_count = len(resume_text.split())

    if 300 <= word_count <= 900:
        return 10
    elif 200 <= word_count <= 1200:
        return 7
    return 4


def formatting_penalty(resume_text):
    if "|" in resume_text or "table" in resume_text.lower():
        return -10
    return 0


def ats_without_jd(resume_text: str):
    score = 0

    score += check_sections(resume_text)
    score += contact_score(resume_text)
    score += bullet_score(resume_text)
    score += action_verb_score(resume_text)
    score += length_score(resume_text)
    score += formatting_penalty(resume_text)

    score = max(min(score, 100), 0)

    return {
        "ATS_score_without_JD": score
    }
