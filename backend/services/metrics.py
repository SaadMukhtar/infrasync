import time
import logging
from prometheus_client import (  # type: ignore
    Counter,
    Histogram,
    Gauge,
    generate_latest,
    CollectorRegistry,
)
from functools import wraps
from typing import Any, Callable, TypeVar, Awaitable

logger = logging.getLogger(__name__)

# Type variable for decorators
F = TypeVar('F', bound=Callable[..., Awaitable[Any]])

# Create a registry for metrics
registry = CollectorRegistry()

# HTTP metrics
http_requests_total = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"],
    registry=registry,
)

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"],
    registry=registry,
)

# Business metrics
digests_generated_total = Counter(
    "digests_generated_total",
    "Total digests generated",
    ["delivery_method", "status"],
    registry=registry,
)

monitors_created_total = Counter(
    "monitors_created_total",
    "Total monitors created",
    ["delivery_method"],
    registry=registry,
)

users_registered_total = Counter(
    "users_registered_total", "Total users registered", registry=registry
)

# API metrics
openai_api_calls_total = Counter(
    "openai_api_calls_total",
    "Total OpenAI API calls",
    ["model", "status"],
    registry=registry,
)

openai_api_errors_total = Counter(
    "openai_api_errors_total",
    "Total OpenAI API errors",
    ["error_type"],
    registry=registry,
)

github_api_calls_total = Counter(
    "github_api_calls_total",
    "Total GitHub API calls",
    ["endpoint", "status"],
    registry=registry,
)

github_api_errors_total = Counter(
    "github_api_errors_total",
    "Total GitHub API errors",
    ["error_type"],
    registry=registry,
)

# Rate limiting metrics
rate_limit_exceeded_total = Counter(
    "rate_limit_exceeded_total",
    "Total rate limit violations",
    ["endpoint", "ip"],
    registry=registry,
)

# System metrics
active_connections = Gauge(
    "active_connections", "Number of active database connections", registry=registry
)

memory_usage_bytes = Gauge(
    "memory_usage_bytes", "Memory usage in bytes", registry=registry
)

cpu_usage_percent = Gauge(
    "cpu_usage_percent", "CPU usage percentage", registry=registry
)

# Queue metrics
queue_size = Gauge(
    "queue_size",
    "Number of items in processing queue",
    ["queue_name"],
    registry=registry,
)

queue_processing_duration_seconds = Histogram(
    "queue_processing_duration_seconds",
    "Time spent processing queue items",
    ["queue_name"],
    registry=registry,
)


class MetricsService:
    """Service for collecting and exposing application metrics"""

    def __init__(self) -> None:
        self.start_time = time.time()

    def record_request(self, method: str, endpoint: str, status: int, duration: float) -> None:
        """Record HTTP request metrics"""
        http_requests_total.labels(
            method=method, endpoint=endpoint, status=status
        ).inc()
        http_request_duration_seconds.labels(method=method, endpoint=endpoint).observe(
            duration
        )

    def record_digest_generation(self, delivery_method: str, status: str) -> None:
        """Record digest generation metrics"""
        digests_generated_total.labels(
            delivery_method=delivery_method, status=status
        ).inc()

    def record_monitor_creation(self, delivery_method: str) -> None:
        """Record monitor creation metrics"""
        monitors_created_total.labels(delivery_method=delivery_method).inc()

    def record_user_registration(self) -> None:
        """Record user registration metrics"""
        users_registered_total.inc()

    def record_openai_call(self, model: str, status: str) -> None:
        """Record OpenAI API call metrics"""
        openai_api_calls_total.labels(model=model, status=status).inc()

    def record_openai_error(self, error_type: str) -> None:
        """Record OpenAI API error metrics"""
        openai_api_errors_total.labels(error_type=error_type).inc()

    def record_github_call(self, endpoint: str, status: str) -> None:
        """Record GitHub API call metrics"""
        github_api_calls_total.labels(endpoint=endpoint, status=status).inc()

    def record_github_error(self, error_type: str) -> None:
        """Record GitHub API error metrics"""
        github_api_errors_total.labels(error_type=error_type).inc()

    def record_rate_limit_violation(self, endpoint: str, ip: str) -> None:
        """Record rate limit violation metrics"""
        rate_limit_exceeded_total.labels(endpoint=endpoint, ip=ip).inc()

    def set_active_connections(self, count: int) -> None:
        """Set active database connections count"""
        active_connections.set(count)

    def set_memory_usage(self, bytes_used: int) -> None:
        """Set memory usage in bytes"""
        memory_usage_bytes.set(bytes_used)

    def set_cpu_usage(self, percent: float) -> None:
        """Set CPU usage percentage"""
        cpu_usage_percent.set(percent)

    def set_queue_size(self, queue_name: str, size: int) -> None:
        """Set queue size"""
        queue_size.labels(queue_name=queue_name).set(size)

    def record_queue_processing_time(self, queue_name: str, duration: float) -> None:
        """Record queue processing time"""
        queue_processing_duration_seconds.labels(queue_name=queue_name).observe(
            duration
        )

    def get_metrics(self) -> str:
        """Get metrics in Prometheus format"""
        result = generate_latest(registry)
        if isinstance(result, bytes):
            return result.decode()
        return str(result)

    def get_uptime(self) -> float:
        """Get application uptime in seconds"""
        return time.time() - self.start_time


# Global metrics service instance
metrics_service = MetricsService()


def track_request_metrics(func: F) -> F:
    """Decorator to track request metrics"""

    @wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        start_time = time.time()
        method = "UNKNOWN"
        endpoint = "UNKNOWN"
        status = 500

        try:
            # Extract request info if available
            if args and hasattr(args[0], "method"):
                method = args[0].method
            if args and hasattr(args[0], "url"):
                endpoint = args[0].url.path

            result = await func(*args, **kwargs)
            status = 200
            return result

        except Exception:
            status = 500
            raise
        finally:
            duration = time.time() - start_time
            metrics_service.record_request(method, endpoint, status, duration)

    return wrapper  # type: ignore


def track_digest_metrics(func: F) -> F:
    """Decorator to track digest generation metrics"""

    @wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        delivery_method = kwargs.get("delivery_method", "unknown")
        try:
            result = await func(*args, **kwargs)
            metrics_service.record_digest_generation(delivery_method, "success")
            return result
        except Exception:
            metrics_service.record_digest_generation(delivery_method, "error")
            raise

    return wrapper  # type: ignore


def track_openai_metrics(func: F) -> F:
    """Decorator to track OpenAI API metrics"""

    @wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        model = kwargs.get("model", "unknown")
        try:
            result = await func(*args, **kwargs)
            metrics_service.record_openai_call(model, "success")
            return result
        except Exception as e:
            metrics_service.record_openai_call(model, "error")
            metrics_service.record_openai_error(type(e).__name__)
            raise

    return wrapper  # type: ignore


def track_github_metrics(func: F) -> F:
    """Decorator to track GitHub API metrics"""

    @wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        endpoint = kwargs.get("endpoint", "unknown")
        try:
            result = await func(*args, **kwargs)
            metrics_service.record_github_call(endpoint, "success")
            return result
        except Exception as e:
            metrics_service.record_github_call(endpoint, "error")
            metrics_service.record_github_error(type(e).__name__)
            raise

    return wrapper  # type: ignore
