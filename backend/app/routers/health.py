"""Liveness / readiness endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core import cache
from app.core.config import get_settings
from app.core.database import ping as pg_ping
from app.core.security import decode_token
from app.models.schemas import HealthResponse, ServiceStatus

settings = get_settings()
router = APIRouter(tags=["health"])
_bearer = HTTPBearer(auto_error=False)


@router.get("/health", response_model=HealthResponse, summary="Service + dependency health")
def health(creds: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> HealthResponse:
    pg = "up" if pg_ping() else "down"
    redis = "up" if cache.ping() else "down"
    status = "healthy" if pg == "up" else "unhealthy" if pg == "down" else "degraded"
    if status == "healthy" and redis != "up":
        status = "degraded"

    # The app's own UI fetches this only after signing in, so a valid token
    # is a reasonable bar for the detailed payload. An anonymous caller
    # (or a probing scanner) gets just enough to know the service is up —
    # not the dependency topology, LLM provider/model, or embedding config.
    authed = bool(creds and creds.scheme.lower() == "bearer" and decode_token(creds.credentials))
    if not authed:
        return HealthResponse(status=status, version=settings.version)  # type: ignore[arg-type]

    return HealthResponse(
        status=status,  # type: ignore[arg-type]
        version=settings.version,
        env=settings.app_env,
        services=ServiceStatus(postgres=pg, redis=redis),
        llm_provider=settings.llm_provider,
        llm_model=settings.active_model_name,
        llm_active=settings.llm_active,
        embedding_provider=settings.embedding_provider,
        embedding_dim=settings.embedding_dim,
    )
