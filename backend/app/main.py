import logging
import os

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import get_settings
from app.routers import extras, scenarios

# Resolved once at startup — works both locally (no ./static) and in Docker
_STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "static")
_STATIC_INDEX = os.path.join(_STATIC_DIR, "index.html")
_SERVING_FRONTEND = os.path.isfile(_STATIC_INDEX)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
_logger = logging.getLogger(__name__)

settings = get_settings()
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.app_name,
    description="AI-powered carbon footprint time machine — see your environmental future.",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url=None,
    openapi_url="/openapi.json" if settings.debug else None,
)

# ── Middleware stack (applied in reverse order) ───────────────────────────────

# 1. GZip — compress responses ≥1 KB
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 2. CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
    max_age=600,
)

# 3. Security headers (OWASP recommended set)
@app.middleware("http")
async def add_security_headers(request: Request, call_next) -> Response:  # type: ignore[type-arg]
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    if request.url.path.startswith("/api"):
        # Strict CSP for pure-JSON API endpoints
        response.headers["Content-Security-Policy"] = (
            "default-src 'none'; frame-ancestors 'none'"
        )
    else:
        # Permissive CSP for serving the React SPA
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "frame-ancestors 'none'"
        )
    return response

# 4. Request body size limit (64 KB max — protects against payload DoS)
MAX_BODY_SIZE = 64 * 1024  # 64 KB

@app.middleware("http")
async def limit_body_size(request: Request, call_next) -> Response:  # type: ignore[type-arg]
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            cl = int(content_length)
        except ValueError:
            return JSONResponse(status_code=400, content={"detail": "Invalid Content-Length"})
        if cl > MAX_BODY_SIZE:
            return JSONResponse(status_code=413, content={"detail": "Request body too large"})
    return await call_next(request)

# ── Rate limiting ─────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Startup validation ────────────────────────────────────────────────────────
@app.on_event("startup")
async def validate_config() -> None:
    if not settings.gemini_api_key:
        _logger.warning(
            "GEMINI_API_KEY not set — AI narratives will use deterministic fallbacks"
        )
    _logger.info("Carbon Time Machine started (debug=%s)", settings.debug)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(scenarios.router)
app.include_router(extras.router)

# ── Static frontend (present in Docker image; absent during local dev) ────────
if _SERVING_FRONTEND:
    assets_dir = os.path.join(_STATIC_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str) -> FileResponse:
        """Catch-all: return index.html so React Router handles the path.
        Unknown /api/* paths get a proper 404 instead of the SPA shell."""
        from fastapi import HTTPException
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        return FileResponse(_STATIC_INDEX)
