"""Tests for AI output sanitizer."""
from app.services.sanitizer import sanitize_ai_text


def test_strips_script_tags():
    assert "<script>" not in sanitize_ai_text("<script>alert(1)</script>Hello")

def test_strips_html_tags():
    result = sanitize_ai_text("<b>bold</b> text")
    assert result == "bold text"

def test_truncates_to_max_length():
    long = "a" * 600
    assert len(sanitize_ai_text(long, max_length=100)) == 100

def test_clean_text_unchanged():
    text = "Your emissions are 3.5 tons."
    assert sanitize_ai_text(text) == text

def test_normalizes_whitespace():
    result = sanitize_ai_text("hello    \n\n\n   world")
    assert "   " not in result
