"""Gemini-powered personalised carbon-reduction tips."""
import json
import logging
import re

from app.models.schemas import CarbonTip
from app.services.gemini_service import _model
from app.services.sanitizer import sanitize_ai_text

_logger = logging.getLogger(__name__)

_VALID_CATS = {"transport", "food", "energy", "shopping", "digital"}

_FALLBACK_TIPS: list[CarbonTip] = [
    CarbonTip(
        title="Take metro or bus twice a week",
        description="Replacing two car commutes per week with public transport saves 400+ kg CO₂ annually — and cuts Mumbai/Delhi traffic stress.",
        estimated_savings_kg=400,
        category="transport",
    ),
    CarbonTip(
        title="Go vegetarian three days a week",
        description="Skipping meat just 3 days/week saves around 300 kg CO₂e per year — start with a dal-rice day.",
        estimated_savings_kg=300,
        category="food",
    ),
    CarbonTip(
        title="Install a 1 kW rooftop solar panel",
        description="A 1 kW system in India generates ~1,400 kWh/year, offsetting 1,148 kg CO₂ at India's grid emission factor of 0.82 kg/kWh.",
        estimated_savings_kg=1148,
        category="energy",
    ),
    CarbonTip(
        title="Buy second-hand clothes this season",
        description="Choosing pre-owned garments saves ~33 kg CO₂ per item — India's thriving resale platforms (OLX, thredUP) make it easy.",
        estimated_savings_kg=200,
        category="shopping",
    ),
    CarbonTip(
        title="Stream at 480p instead of HD",
        description="Lowering video quality by one tier reduces data-centre energy ~60%, saving roughly 14 kg CO₂ per year of casual viewing.",
        estimated_savings_kg=14,
        category="digital",
    ),
]


async def generate_tips(
    current_annual_tons: float,
    breakdown: dict[str, float],
) -> list[CarbonTip]:
    """Return 5 personalised CO₂ reduction tips via Gemini, with deterministic fallback."""
    top_cats = sorted(breakdown.items(), key=lambda x: x[1], reverse=True)[:3]
    top_str = ", ".join(f"{k}: {v:.2f} t" for k, v in top_cats)
    breakdown_str = ", ".join(f"{k}: {v:.2f} t" for k, v in breakdown.items())

    prompt = (
        "You are a carbon reduction advisor for India. "
        f"This person emits {current_annual_tons:.1f} tons CO₂e/year.\n"
        f"Breakdown: {breakdown_str}\n"
        f"Highest categories: {top_str}\n\n"
        "Return a JSON array of exactly 5 objects. Each object must have:\n"
        '  "title": string (6–10 words, starts with an action verb)\n'
        '  "description": string (1–2 sentences, India-specific, practical)\n'
        '  "estimated_savings_kg": number (realistic annual CO₂ reduction in kg, ≥0)\n'
        '  "category": one of "transport","food","energy","shopping","digital"\n\n'
        "Prioritise the highest-emission categories. Mention real India context "
        "(metro, CNG auto, solar subsidy, Swiggy/Zomato, etc.).\n"
        "Return ONLY the raw JSON array — no markdown fences, no extra text."
    )

    try:
        response = _model().generate_content(prompt)
        raw = (response.text or "").strip()
        if not raw:
            raise ValueError("Gemini returned empty/blocked response")
        # Strip optional ```json … ``` fences (strip first so ^ and $ anchors work)
        raw = raw.strip()
        raw = re.sub(r"^```[a-z]*\s*", "", raw, flags=re.IGNORECASE)
        raw = re.sub(r"\s*```$", "", raw).strip()
        data = json.loads(raw)
        if not isinstance(data, list):
            raise ValueError(f"Expected JSON array, got {type(data).__name__}")
        tips: list[CarbonTip] = []
        for item in data[:5]:
            cat = item.get("category", "transport")
            tips.append(
                CarbonTip(
                    title=sanitize_ai_text(str(item.get("title", "")), max_length=120),
                    description=sanitize_ai_text(str(item.get("description", "")), max_length=400),
                    estimated_savings_kg=max(0.0, float(item.get("estimated_savings_kg", 0))),
                    category=cat if cat in _VALID_CATS else "transport",  # type: ignore[arg-type]
                )
            )
        if len(tips) < 5:
            _logger.warning("Gemini returned only %d tips; using fallback", len(tips))
            return _FALLBACK_TIPS
        return tips
    except (json.JSONDecodeError, ValueError, KeyError, TypeError) as exc:
        _logger.warning("Gemini tips parse/validation failed (%s); using fallback", exc)
        return _FALLBACK_TIPS
    except Exception as exc:
        _logger.exception("Unexpected error in generate_tips; using fallback")
        return _FALLBACK_TIPS
