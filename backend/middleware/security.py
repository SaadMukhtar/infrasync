"""
Optional security middleware for advanced setups.
Only needed if not using WAF or API Gateway.
Recommended for self-hosted FastAPI behind ALB or Docker.
"""

import time
import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from config import SECURITY_HEADERS, DEBUG
import re
from typing import Any

logger = logging.getLogger(__name__)


class SecurityMiddleware:
    def __init__(self, app: Any) -> None:
        self.app = app

    async def __call__(self, scope: dict[str, Any], receive: Any, send: Any) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)

        # Security checks
        if not await self._security_checks(request):
            response = JSONResponse(
                status_code=403, content={"detail": "Security check failed"}
            )
            await response(scope, receive, send)
            return

        # Add security headers
        async def send_with_headers(message: dict[str, Any]) -> None:
            if message["type"] == "http.response.start":
                # Add security headers
                headers = dict(message.get("headers", []))
                for key, value in SECURITY_HEADERS.items():
                    headers[key.lower().encode()] = value.encode()
                message["headers"] = list(headers.items())
            await send(message)

        await self.app(scope, receive, send_with_headers)

    async def _security_checks(self, request: Request) -> bool:
        """Perform security checks on incoming requests"""
        try:
            # Check for suspicious headers
            suspicious_headers = [
                "x-forwarded-host",
                "x-forwarded-proto",
                "x-real-ip",
                "x-forwarded-for",
            ]

            for header in suspicious_headers:
                if header in request.headers:
                    value = request.headers[header]
                    if not self._is_valid_header_value(value):
                        logger.warning(f"Suspicious header value: {header}={value}")
                        return False

            # Check for SQL injection patterns in query params
            query_string = str(request.query_params)
            if self._contains_sql_injection(query_string):
                logger.warning(f"Potential SQL injection in query: {query_string}")
                return False

            # Check for XSS patterns in headers
            for header_name, header_value in request.headers.items():
                if self._contains_xss(header_value):
                    logger.warning(
                        f"Potential XSS in header {header_name}: {header_value}"
                    )
                    return False

            return True

        except Exception as e:
            logger.error(f"Security check error: {e}")
            return False

    def _is_valid_header_value(self, value: str) -> bool:
        """Validate header values"""
        # Basic validation - no control characters
        if re.search(r"[\x00-\x1f\x7f]", value):
            return False
        return True

    def _contains_sql_injection(self, text: str) -> bool:
        """Check for SQL injection patterns"""
        sql_patterns = [
            r"(\b(union|select|insert|update|delete|drop|create|alter)\b)",
            r"(\b(or|and)\b\s+\d+\s*=\s*\d+)",
            r"(--|#|/\*|\*/)",
            r"(\b(exec|execute|script)\b)",
        ]

        for pattern in sql_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False

    def _contains_xss(self, text: str) -> bool:
        """Check for XSS patterns"""
        xss_patterns = [
            r"<script[^>]*>",
            r"javascript:",
            r"on\w+\s*=",
            r"<iframe[^>]*>",
            r"<object[^>]*>",
            r"<embed[^>]*>",
        ]

        for pattern in xss_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False


class RateLimitMiddleware:
    def __init__(self, app: Any, limiter: Any) -> None:
        self.app = app
        self.limiter = limiter

    async def __call__(self, scope: dict[str, Any], receive: Any, send: Any) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)

        # Get client IP
        client_ip = self._get_client_ip(request)

        # Check rate limit
        if not await self._check_rate_limit(request, client_ip):
            response = JSONResponse(
                status_code=429, content={"detail": "Rate limit exceeded"}
            )
            await response(scope, receive, send)
            return

        await self.app(scope, receive, send)

    def _get_client_ip(self, request: Request) -> str:
        """Get the real client IP address"""
        # Check for forwarded headers
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip

        if request.client is not None:
            return request.client.host
        return "unknown"

    async def _check_rate_limit(self, request: Request, client_ip: str) -> bool:
        """Check if request is within rate limits"""
        # This would integrate with your existing rate limiter
        # For now, return True to allow all requests
        return True


class LoggingMiddleware:
    def __init__(self, app: Any) -> None:
        self.app = app

    async def __call__(self, scope: dict[str, Any], receive: Any, send: Any) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        start_time = time.time()
        request = Request(scope, receive)

        # Log request
        logger.info(
            f"Request: {request.method} {request.url.path} "
            f"from {request.client.host if request.client is not None else 'unknown'} "
            f"User-Agent: {request.headers.get('user-agent', 'Unknown')}"
        )

        # Track response
        response_status = None
        response_size = 0

        async def send_with_logging(message: dict[str, Any]) -> None:
            nonlocal response_status, response_size

            if message["type"] == "http.response.start":
                response_status = message["status"]
            elif message["type"] == "http.response.body":
                response_size += len(message.get("body", b""))

            await send(message)

        try:
            await self.app(scope, receive, send_with_logging)
        except Exception as e:
            logger.error(f"Request failed: {e}")
            raise
        finally:
            # Log response
            duration = time.time() - start_time
            logger.info(
                f"Response: {response_status or 'unknown'} "
                f"in {duration:.3f}s "
                f"size: {response_size} bytes"
            )


class ErrorHandlingMiddleware:
    def __init__(self, app: Any) -> None:
        self.app = app

    async def __call__(self, scope: dict[str, Any], receive: Any, send: Any) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        try:
            await self.app(scope, receive, send)
        except Exception as e:
            logger.error(f"Unhandled exception: {e}", exc_info=True)

            # Return a generic error response
            response = JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal server error",
                    "error_id": f"err_{int(time.time())}",
                },
            )

            if not DEBUG:
                # In production, don't expose error details
                await response(scope, receive, send)
            else:
                # In development, show the actual error
                error_response = JSONResponse(
                    status_code=500,
                    content={
                        "detail": str(e),
                        "type": type(e).__name__,
                        "error_id": f"err_{int(time.time())}",
                    },
                )
                await error_response(scope, receive, send)
