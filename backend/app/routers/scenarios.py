import logging

from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.models.schemas import ScenarioResponse, UserProfile
from app.services.scenario_generator import generate_scenarios

_logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api", tags=["scenarios"])


@router.post("/scenarios", response_model=ScenarioResponse)
@limiter.limit("5/minute")
async def create_scenarios(request: Request, profile: UserProfile) -> ScenarioResponse:
    """Generate three future timeline scenarios from a user's carbon profile."""
    try:
        return await generate_scenarios(profile)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        _logger.exception("Scenario generation failed")
        raise HTTPException(status_code=500, detail="Scenario generation failed") from exc


@router.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "Carbon Time Machine"}
