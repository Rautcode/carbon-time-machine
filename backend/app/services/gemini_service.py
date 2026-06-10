"""Thin async wrapper around Google Gemini API."""
import asyncio
import logging
import threading

import google.generativeai as genai

from app.core.config import get_settings
from app.services.sanitizer import sanitize_ai_text

_logger = logging.getLogger(__name__)

# Tree absorption constant — 21 kg CO₂/year per mature tree (USDA Forest Service)
_TREE_ABSORPTION_TONS = 0.021

# Thread-safe lazy singleton — genai.configure() called exactly once
_gemini_model: genai.GenerativeModel | None = None
_model_lock = threading.Lock()


def _model() -> genai.GenerativeModel:
    """Return the cached Gemini model, initialising it on first call (thread-safe)."""
    global _gemini_model
    if _gemini_model is None:
        with _model_lock:
            if _gemini_model is None:   # double-checked locking
                settings = get_settings()
                if not settings.gemini_api_key:
                    raise ValueError("GEMINI_API_KEY is not configured")
                genai.configure(api_key=settings.gemini_api_key)
                _gemini_model = genai.GenerativeModel("gemini-1.5-flash")
    return _gemini_model


def _safe_text(response: genai.types.GenerateContentResponse) -> str:
    """Extract text from a Gemini response, returning '' on safety-filter blocks.

    The SDK raises ValueError (not returns None) when .text is accessed on a
    blocked response, so we catch that explicitly.
    """
    try:
        return (response.text or "").strip()
    except ValueError:
        return ""


async def _generate(prompt: str) -> genai.types.GenerateContentResponse:
    """Run a synchronous Gemini generate_content call in a thread pool executor
    so it never blocks the asyncio event loop.
    30-second timeout prevents thread exhaustion on API hangs.
    """
    return await asyncio.to_thread(
        _model().generate_content, prompt,
        request_options={"timeout": 30},
    )


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
        raw = _safe_text(await _generate(prompt))
        if not raw:
            raise ValueError("Empty Gemini response (possible safety filter)")
        return sanitize_ai_text(raw, max_length=400)
    except Exception as exc:
        _logger.warning("Gemini narrative failed (%s); using fallback", exc)
        safe_annual = max(annual_tons, 0)
        safe_cumul  = max(cumulative_tons, 0)
        trees = round(safe_annual / _TREE_ABSORPTION_TONS)
        return (
            f"By {year} your lifestyle emits {safe_annual:.1f} tons of CO₂ annually — "
            f"equivalent to {trees:,} trees working full-time to keep up. "
            f"You have contributed {safe_cumul:.0f} tons cumulatively since 2025."
        )


async def generate_2050_letter(
    current_annual_tons: float,
    dominant_category: str,
    scenario_id: str,
    total_savings_tons: float,
    final_year_tons: float,
) -> str:
    """Return a personal letter from the user's 2050 self, ~220 words, India-specific."""
    path_desc = {
        "committed": (
            "made bold, consistent lifestyle changes — less driving, a more plant-based diet, "
            "rooftop solar, conscious consumption — and stuck with them for 25 years"
        ),
        "small": (
            "made modest improvements — some public transport, minor energy upgrades — "
            "but didn't fully commit to a low-carbon life"
        ),
        "bau": (
            "continued living exactly as they did in 2025 — no major changes to transport, "
            "diet, energy use, or shopping habits"
        ),
    }.get(scenario_id, "made lifestyle changes")

    tone = (
        "hopeful and grateful" if scenario_id == "committed"
        else "bittersweet and reflective" if scenario_id == "small"
        else "somber and regretful"
    )

    savings_line = (
        f"Their choices cumulatively avoided {total_savings_tons:.1f} tons of CO₂."
        if total_savings_tons > 0.5
        else "Their choices did not significantly reduce their carbon footprint."
    )

    # Extract into variable to avoid nested quotes inside f-string (Python 3.12+ compat)
    closing_word = "hope" if scenario_id == "committed" else "reflection"

    try:
        prompt = (
            f"Write a personal letter from someone's 2050 self to their 2025 self.\n\n"
            f"Facts about this person:\n"
            f"- Lives in India\n"
            f"- In 2025 their carbon footprint was {current_annual_tons:.1f} tons CO₂/year\n"
            f"- Their biggest emission source was {dominant_category}\n"
            f"- They {path_desc}\n"
            f"- By 2050 their annual footprint is {final_year_tons:.1f} tons CO₂\n"
            f"- {savings_line}\n\n"
            f"Requirements:\n"
            f"- Tone: {tone}\n"
            f"- Exactly 3 paragraphs\n"
            f"- Para 1: Describe India in 2050 under this scenario — sensory, specific, vivid "
            f"(mention real places, seasons, monsoon, cities if relevant)\n"
            f"- Para 2: Reflect on the 2025 choice and its downstream ripple effects on daily life\n"
            f"- Para 3: What you wish your 2025 self had known, or a word of gratitude/warning\n"
            f"- First person ('I', 'we'), addressed to 'you' (the 2025 self)\n"
            f"- India-specific references; no generic Western imagery\n"
            f"- NO preaching, NO statistics in the letter itself\n"
            f"- Max 230 words total\n"
            f"- End with: 'With {closing_word},\\nYou — 2050'"
        )
        raw = _safe_text(await _generate(prompt))
        if not raw:
            raise ValueError("Empty Gemini response (possible safety filter)")
        return sanitize_ai_text(raw, max_length=1400)
    except Exception as exc:
        _logger.warning("Gemini 2050 letter failed (%s); using fallback", exc)
        if scenario_id == "committed":
            return (
                "The mornings are different now. Bengaluru still gets its summer rains, but they arrive "
                "when expected again — something my grandchildren take for granted, not knowing the decade "
                "when the monsoon became unpredictable. The air in our neighbourhood has a different quality "
                "to it. Not just cleaner; quieter.\n\n"
                "It started with the choices you made in 2025. The metro pass, the solar panels, the Saturday "
                "market instead of the delivery app. None of it felt like sacrifice at the time — just small "
                "shifts. But those shifts compounded. Friends followed. The building committee followed. "
                "Change moves through people before it moves through policy.\n\n"
                "What I wish you knew: the inconvenience lasts a month. The pride lasts a lifetime. "
                "Start before you feel ready.\n\nWith hope,\nYou — 2050"
            )
        if scenario_id == "small":
            return (
                "Mumbai's sea wall holds, mostly. The rains still come to the Konkan coast, though the timing "
                "is anyone's guess now. Life is fine — not the catastrophe some predicted, not the ease we "
                "hoped for. We adapted, as people always do. But adaptation has a texture to it that's hard "
                "to describe unless you've lived it.\n\n"
                "The half-steps you took in 2025 mattered more than you knew, and less than they could have. "
                "Every commute you chose the metro instead of the car, you were voting for something. "
                "The problem is you voted inconsistently. Change needs compound interest, not occasional deposits.\n\n"
                "Go further than feels reasonable. The middle path looks safe from 2025. "
                "From 2050, it mostly looks like hesitation.\n\nWith reflection,\nYou — 2050"
            )
        return (
            "The summer in Delhi now starts in February and doesn't release its grip until November. "
            "People have adapted — they always do — but adaptation has a cost that doesn't show up on "
            "any spreadsheet. The mango season is shorter. The old people remember how it used to be.\n\n"
            "I think about 2025 often. Not with anger — what would that change? — but with a quiet "
            "awareness of how ordinary the choices looked at the time. Drive or take the metro. Order "
            "online or cook at home. Each one felt too small to matter. Collectively, they weren't.\n\n"
            "If I could reach back, I'd say this: the friction you feel is not evidence that change is "
            "hard. It's evidence that change is real. Lean into it.\n\nWith reflection,\nYou — 2050"
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
        raw = _safe_text(await _generate(prompt))
        if not raw:
            raise ValueError("Empty Gemini response (possible safety filter)")
        return sanitize_ai_text(raw, max_length=200)
    except Exception as exc:
        _logger.warning("Gemini summary failed (%s); using fallback", exc)
        n = len(changes)
        if savings_tons > 0:
            return (
                f"Making {n} change{'s' if n != 1 else ''} saves "
                f"{savings_tons:.1f} tons of CO₂ and ₹{savings_inr:,.0f} by 2040."
            )
        return "Continuing current habits keeps your footprint unchanged by 2040."
