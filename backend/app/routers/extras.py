"""Extra API endpoints: AI carbon tips + live climate context."""
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.models.schemas import ClimateContext, TipsRequest, TipsResponse
from app.services.climate_service import get_climate_context
from app.services.tips_service import generate_tips

_logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api", tags=["extras"])


@router.get("/climate", response_model=ClimateContext)
@limiter.limit("30/minute")
async def climate_context(request: Request) -> ClimateContext:
    """Return real-time temperature from Open-Meteo + global warming context."""
    try:
        return await get_climate_context()
    except Exception as exc:
        _logger.exception("Climate context failed")
        raise HTTPException(
            status_code=503, detail="Climate data temporarily unavailable"
        ) from exc


@router.post("/tips", response_model=TipsResponse)
@limiter.limit("10/minute")
async def carbon_tips(request: Request, body: TipsRequest) -> TipsResponse:
    """Generate 5 personalised carbon-reduction tips via Gemini AI."""
    try:
        tips = await generate_tips(body.current_annual_tons, body.breakdown)
        return TipsResponse(
            tips=tips,
            generated_at=datetime.now(timezone.utc).isoformat(),
        )
    except Exception as exc:
        _logger.exception("Tips generation failed")
        raise HTTPException(status_code=500, detail="Tips generation failed") from exc
