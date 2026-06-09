"""
Sanitize text coming from external AI models before returning to clients.
Strips HTML/script tags to prevent reflected XSS.
"""
import re

# Remove any HTML/script tags an LLM might produce
_TAG_RE = re.compile(r"<[^>]+>", re.IGNORECASE)
# Collapse excessive whitespace
_SPACE_RE = re.compile(r"\s{3,}")


def sanitize_ai_text(text: str, max_length: int = 500) -> str:
    """Strip tags, normalize whitespace, and truncate to max_length."""
    cleaned = _TAG_RE.sub("", text)
    cleaned = _SPACE_RE.sub(" ", cleaned).strip()
    return cleaned[:max_length]
