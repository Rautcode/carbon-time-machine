"""Thin async wrapper around Google Gemini API."""
import logging
import google.generativeai as genai

from app.core.config import get_settings

_logger = logging.getLogger(__name__)


def _model() -> genai.GenerativeModel:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise ValueError("GEMINI_API_KEY is not configured")
    genai.configure(api_key=settings.gemini_api_key)
    return genai.GenerativeModel("gemini-1.5-flash")


async def generate_timeline_narrative(
    year: int,
    profile_summary: str,
    annual_tons: float,
    cumulative_tons: float,
    financial_cost_inr: float,
) -> str:
    """Return a 2-sentence vivid narrative for a future year."""
    try:
        prompt = (
            f"You are a climate storyteller. Write exactly 2 sentences for the year {year}, "
            f"speaking directly to this person.\n"
            f"Profile: {profile_summary}\n"
            f"Annual CO₂: {annual_tons:.1f} tons | Cumulative since 2025: {cumulative_tons:.0f} tons | "
            f"Annual cost: ₹{financial_cost_inr:,.0f}\n"
            "Be factual, vivid, India-specific. No preaching. 2 sentences max."
        )
        response = _model().generate_content(prompt)
        return response.text.strip()
    except Exception as exc:
        _logger.warning("Gemini narrative failed (%s); using fallback", exc)
        return (
            f"By {year} your lifestyle emits {annual_tons:.1f} tons of CO₂ annually — "
            f"equivalent to {round(annual_tons / 0.021):,} trees working full-time to keep up. "
            f"You've contributed {cumulative_tons:.0f} tons cumulatively since 2025."
        )


async def generate_scenario_summary(
    label: str,
    changes: list[str],
    savings_tons: float,
    savings_inr: float,
) -> str:
    """Return a one-sentence motivational summary for an alternate scenario."""
    try:
        changes_str = "; ".join(changes) if changes else "no changes"
        prompt = (
            f"Summarize this lifestyle scenario in exactly 1 punchy sentence.\n"
            f"Scenario: {label}\nChanges: {changes_str}\n"
            f"CO₂ saved by 2040: {savings_tons:.1f} tons | Money saved: ₹{savings_inr:,.0f}\n"
            "Be specific, inspiring, India-relevant. 1 sentence."
        )
        response = _model().generate_content(prompt)
        return response.text.strip()
    except Exception as exc:
        _logger.warning("Gemini summary failed (%s); using fallback", exc)
        n = len(changes)
        return (
            f"{'Making ' + str(n) + ' changes' if n else 'Continuing current habits'} "
            f"{'saves ' + str(round(savings_tons, 1)) + ' tons of CO₂ and ₹' + f'{savings_inr:,.0f}' + ' by 2040.' if savings_tons > 0 else 'keeps your footprint unchanged by 2040.'}"
        )
