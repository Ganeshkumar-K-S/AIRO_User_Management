# ──────────────────────────────────────────────────────────
# config.py — Tailoring Engine Configuration
#
# All tuneable constants for the tailoring pipeline.
# Reads from environment variables with sensible defaults.
# Auto-loads .env file from project root if python-dotenv
# is installed.
# ──────────────────────────────────────────────────────────

import os

try:
    from dotenv import load_dotenv
    _config_dir = os.path.dirname(os.path.abspath(__file__))
    _project_root = os.path.abspath(os.path.join(_config_dir, "..", ".."))
    load_dotenv(os.path.join(_project_root, ".env"))
except ImportError:
    pass

# Groq API settings
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_TEMPERATURE = 0.3
GROQ_MAX_TOKENS = 4096
GROQ_MAX_RETRIES = 2

# Multi-model fallback chain (tried in order if primary fails)
GROQ_FALLBACK_MODELS = [
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
]

# Embedding model for semantic skill matching
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
SEMANTIC_THRESHOLD = 0.55

# Skill clustering
CLUSTER_THRESHOLD = 0.65

# Skill limits
MAX_SKILLS = 12
MIN_SKILLS = 5
RELEVANCE_THRESHOLD = 0.3

# Content density (1-page target)
MAX_BULLETS_PER_ITEM = 4
MAX_EXPERIENCE_ITEMS = 3
MAX_PROJECT_ITEMS = 4

# Quality scoring thresholds
MIN_BULLET_LENGTH = 8
MIN_KEYWORD_DENSITY = 0.15
MIN_QUALITY_SCORE = 0.5

# Template theming defaults
THEME_COLORS = {
    "primary": "2D3748",
    "accent": "3182CE",
}
THEME_FONT = "Latin Modern Sans"

# Default section ordering
DEFAULT_SECTION_ORDER = [
    "professional_summary",
    "skills",
    "experience",
    "projects",
    "education",
    "certifications",
    "achievements",
    "publications",
]
