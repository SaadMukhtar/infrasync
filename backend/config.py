import os
from pathlib import Path
from dotenv import load_dotenv
import logging
from slowapi.util import get_remote_address
from slowapi import Limiter
from typing import List, Optional

logger = logging.getLogger(__name__)

# Load the .env early
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

# Environment validation
def validate_env():
    required_vars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        err_msg = f"(config): Missing required environment variables: {missing}"
        logger.error(err_msg)
        raise ValueError(err_msg)

    # Validate optional but important vars
    if os.getenv("OPENAI_ENABLED", "false").lower() in ("1", "true", "yes", "y"):
        if not os.getenv("OPENAI_API_KEY"):
            logger.warning("OPENAI_ENABLED is true but OPENAI_API_KEY is not set")

# Environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = ENVIRONMENT == "development"

# Front-end
FRONTEND_URL = os.getenv("FRONTEND_URL")
if not FRONTEND_URL or not FRONTEND_URL.startswith(("http://", "https://")):
    raise ValueError("FRONTEND_URL must be set and start with http:// or https:// (current: '{}')".format(FRONTEND_URL))

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# OpenAI
OPENAI_ENABLED = os.getenv("OPENAI_ENABLED", "false").lower() in ("1", "true", "yes", "y")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
OPENAI_MAX_TOKENS = int(os.getenv("OPENAI_MAX_TOKENS", "400"))

# GitHub
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

# Security Settings
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# CORS Settings
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
ALLOWED_HEADERS = [
    "Content-Type",
    "Authorization",
    "X-API-Key",
    "Accept",
    "Origin",
    "X-Requested-With",
    "X-Forwarded-For",
    "X-Real-IP",
]

# Security Headers
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
}

# Rate Limiting Configuration
RATE_LIMIT_DEFAULT = os.getenv("RATE_LIMIT_DEFAULT", "100/minute")
RATE_LIMIT_AUTH = os.getenv("RATE_LIMIT_AUTH", "5/minute")
RATE_LIMIT_DIGEST = os.getenv("RATE_LIMIT_DIGEST", "10/minute")

# Logging Configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# Monitoring Configuration
ENABLE_METRICS = os.getenv("ENABLE_METRICS", "true").lower() in ("1", "true", "yes", "y")
METRICS_PORT = int(os.getenv("METRICS_PORT", "9090"))

# Feature Flags
FEATURE_FLAGS = {
    "enable_analytics": os.getenv("ENABLE_ANALYTICS", "false").lower() in ("1", "true", "yes", "y"),
    "enable_weekly_digests": os.getenv("ENABLE_WEEKLY_DIGESTS", "false").lower() in ("1", "true", "yes", "y"),
    "enable_on_merge_digests": os.getenv("ENABLE_ON_MERGE_DIGESTS", "false").lower() in ("1", "true", "yes", "y"),
}

# Stripe
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
STRIPE_PRICE_IDS = {
    "free": os.getenv("STRIPE_PRICE_ID_FREE"),
    "pro": os.getenv("STRIPE_PRICE_ID_PRO"),
    "team": os.getenv("STRIPE_PRICE_ID_TEAM"),
}
PLAN_LIMITS = {
    "free": {"max_repos": 1, "max_channels": 1},
    "pro": {"max_repos": 5, "max_channels": 5},
    "team": {"max_repos": 100, "max_channels": 20},
}

# Rate Limiting
limiter = Limiter(key_func=get_remote_address)

# Validate environment on import
validate_env()

# Log configuration on startup
if DEBUG:
    logger.info(f"Environment: {ENVIRONMENT}")
    logger.info(f"OpenAI Enabled: {OPENAI_ENABLED}")
    logger.info(f"Allowed Origins: {ALLOWED_ORIGINS}")
    logger.info(f"Feature Flags: {FEATURE_FLAGS}")
