from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from fastapi.responses import JSONResponse
import logging
import time
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Any

from routes.digest import router as digest_router
from routes.monitor import router as monitor_router
from routes.auth import router as auth_router
from routes.org import router as org_router
from routes.billing import router as billing_router

from config import (
    limiter,
    ALLOWED_ORIGINS,
    ALLOWED_METHODS,
    ALLOWED_HEADERS,
    DEBUG,
    ENVIRONMENT,
    LOG_LEVEL,
    LOG_FORMAT,
    ENABLE_METRICS,
)

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from middleware.security import LoggingMiddleware, ErrorHandlingMiddleware

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format=LOG_FORMAT,
    handlers=[
        logging.StreamHandler(),
        (
            logging.FileHandler("app.log")
            if ENVIRONMENT == "production"
            else logging.NullHandler()
        ),
    ],
)

logger = logging.getLogger(__name__)

API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)


# Startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup
    logger.info(f"Starting Infrasync API in {ENVIRONMENT} mode")
    logger.info(f"Debug mode: {DEBUG}")
    logger.info(f"Metrics enabled: {ENABLE_METRICS}")

    # Health check for dependencies
    await check_dependencies()

    yield

    # Shutdown
    logger.info("Shutting down Infrasync API")


async def check_dependencies() -> None:
    """Check if all required services are available"""
    try:
        # Check Supabase connection
        from supabase import create_client
        from config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

        if SUPABASE_URL is None or SUPABASE_SERVICE_ROLE_KEY is None:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must not be None")
        client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        # Simple query to test connection
        client.table("monitors").select("id").limit(1).execute()
        logger.info("✅ Supabase connection successful")

    except Exception as e:
        logger.error(f"❌ Supabase connection failed: {e}")
        if ENVIRONMENT == "production":
            raise


# Create FastAPI app
app = FastAPI(
    title="Infrasync API",
    description="A developer tool for monitoring GitHub repositories and sending GPT-generated summaries",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if DEBUG else None,
    redoc_url="/redoc" if DEBUG else None,
)

# Add security middleware
app.add_middleware(LoggingMiddleware)
app.add_middleware(ErrorHandlingMiddleware)

# Add CORS middleware with explicit configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=ALLOWED_METHODS,
    allow_headers=ALLOWED_HEADERS,
    expose_headers=["*"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Configure rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore


# Custom exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle HTTP exceptions with proper logging"""
    logger.warning(
        f"HTTP {exc.status_code}: {request.method} {request.url.path} - {exc.detail}"
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "error_id": f"http_{int(time.time())}"},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle general exceptions with proper logging"""
    error_id = f"err_{int(time.time())}"
    logger.error(
        f"Unhandled exception {error_id}: {request.method} {request.url.path} - {str(exc)}",
        exc_info=True,
    )

    if DEBUG:
        return JSONResponse(
            status_code=500,
            content={
                "detail": str(exc),
                "type": type(exc).__name__,
                "error_id": error_id,
            },
        )
    else:
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "error_id": error_id},
        )


# Include routers with proper rate limiting
app.include_router(
    digest_router,
    prefix="/api/v1",
    tags=["digest"],
)
app.include_router(
    monitor_router,
    prefix="/api/v1",
    tags=["monitor"],
)
app.include_router(auth_router, prefix="/api/v1", tags=["auth"])
app.include_router(org_router, prefix="/api/v1", tags=["org"])
app.include_router(billing_router, prefix="/api/v1", tags=["billing"])


@app.get("/")
async def root() -> dict[str, Any]:
    """Health check endpoint."""
    return {
        "message": "Infrasync API is running",
        "version": "1.0.0",
        "environment": ENVIRONMENT,
        "endpoints": {
            "health": "/health",
            "docs": "/docs" if DEBUG else "disabled",
            "digest": "/api/v1/digest",
        },
    }


@app.get("/health")
async def health_check() -> dict[str, Any]:
    """Comprehensive health check endpoint."""
    from typing import Dict, Any
    health_status: dict[str, Any] = {
        "status": "healthy",
        "timestamp": time.time(),
        "environment": ENVIRONMENT,
        "version": "1.0.0",
        "checks": {},
    }

    # Check Supabase
    try:
        from supabase import create_client
        from config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

        if SUPABASE_URL is None or SUPABASE_SERVICE_ROLE_KEY is None:
            raise HTTPException(status_code=500, detail="Supabase config missing")
        client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        client.table("monitors").select("id").limit(1).execute()
        health_status["checks"]["database"] = "healthy"
    except Exception as e:
        health_status["checks"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"

    # Check OpenAI (if enabled)
    try:
        from config import OPENAI_ENABLED, OPENAI_API_KEY

        if OPENAI_ENABLED and OPENAI_API_KEY:
            health_status["checks"]["openai"] = "configured"
        else:
            health_status["checks"]["openai"] = "disabled"
    except Exception as e:
        health_status["checks"]["openai"] = f"error: {str(e)}"

    return health_status


@app.get("/metrics")
async def metrics() -> dict[str, Any]:
    """Basic metrics endpoint (placeholder for Prometheus metrics)"""
    if not ENABLE_METRICS:
        raise HTTPException(status_code=404, detail="Metrics disabled")

    # Basic metrics - in production, you'd want to use Prometheus
    return {
        "uptime": time.time(),
        "requests_total": 0,  # Would be tracked in production
        "requests_failed": 0,
        "active_connections": 0,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app, host="0.0.0.0", port=8000, log_level=LOG_LEVEL.lower(), access_log=True
    )
