import logging
import os
import sys
from typing import Dict, Any, Optional
from functools import wraps
import traceback
import time

# Try to import Sentry, but don't fail if not available
try:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
    from sentry_sdk.integrations.redis import RedisIntegration
    from sentry_sdk.integrations.httpx import HttpxIntegration
    SENTRY_AVAILABLE = True
except ImportError:
    SENTRY_AVAILABLE = False

logger = logging.getLogger(__name__)

class ErrorReportingService:
    """Service for error reporting and monitoring"""
    
    def __init__(self):
        self.sentry_initialized = False
        self.error_counts = {}
        self.last_error_time = {}
        
    def initialize_sentry(self, dsn: str, environment: str = "development"):
        """Initialize Sentry SDK"""
        if not SENTRY_AVAILABLE:
            logger.warning("Sentry SDK not available. Error reporting will be limited.")
            return
            
        try:
            sentry_sdk.init(
                dsn=dsn,
                environment=environment,
                integrations=[
                    FastApiIntegration(),
                    SqlalchemyIntegration(),
                    RedisIntegration(),
                    HttpxIntegration(),
                ],
                # Set traces_sample_rate to 1.0 to capture 100% of transactions for performance monitoring.
                traces_sample_rate=0.1,
                # Set profiles_sample_rate to 1.0 to profile 100% of sampled transactions.
                profiles_sample_rate=0.1,
                # Enable automatic instrumentation of SQL queries
                auto_enabling_integrations=True,
                # Configure before_send to filter out certain errors
                before_send=self._before_send,
                # Configure before_breadcrumb to filter out certain breadcrumbs
                before_breadcrumb=self._before_breadcrumb,
            )
            self.sentry_initialized = True
            logger.info("Sentry initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Sentry: {e}")
            
    def _before_send(self, event: Dict[str, Any], hint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Filter events before sending to Sentry"""
        # Don't send certain types of errors
        if 'exception' in event:
            exception = event['exception']
            if exception and 'values' in exception:
                for value in exception['values']:
                    # Filter out rate limiting errors
                    if 'RateLimitExceeded' in str(value.get('type', '')):
                        return None
                    # Filter out validation errors (too noisy)
                    if 'ValidationError' in str(value.get('type', '')):
                        return None
                        
        # Add custom context
        event.setdefault('tags', {})
        event['tags']['service'] = 'infrasync-api'
        
        return event
        
    def _before_breadcrumb(self, breadcrumb: Dict[str, Any], hint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Filter breadcrumbs before sending to Sentry"""
        # Don't send certain types of breadcrumbs
        if breadcrumb.get('category') == 'http':
            # Filter out health check requests
            if '/health' in breadcrumb.get('data', {}).get('url', ''):
                return None
                
        return breadcrumb
        
    def capture_exception(self, exception: Exception, context: Optional[Dict[str, Any]] = None):
        """Capture an exception and send to Sentry"""
        if self.sentry_initialized and SENTRY_AVAILABLE:
            try:
                with sentry_sdk.push_scope() as scope:
                    if context:
                        for key, value in context.items():
                            scope.set_tag(key, value)
                    sentry_sdk.capture_exception(exception)
            except Exception as e:
                logger.error(f"Failed to capture exception in Sentry: {e}")
                
        # Also log locally
        logger.error(f"Exception captured: {exception}", exc_info=True)
        
    def capture_message(self, message: str, level: str = "error", context: Optional[Dict[str, Any]] = None):
        """Capture a message and send to Sentry"""
        if self.sentry_initialized and SENTRY_AVAILABLE:
            try:
                with sentry_sdk.push_scope() as scope: 
                    if context:
                        for key, value in context.items():
                            scope.set_tag(key, value)
                    sentry_sdk.capture_message(message, level=level)
            except Exception as e:
                logger.error(f"Failed to capture message in Sentry: {e}")
                
        # Also log locally
        log_level = getattr(logging, level.upper(), logging.ERROR)
        logger.log(log_level, message)
        
    def set_user_context(self, user_id: str, email: str, org_id: Optional[str] = None):
        """Set user context for error reporting"""
        if self.sentry_initialized and SENTRY_AVAILABLE:
            sentry_sdk.set_user({
                "id": user_id,
                "email": email,
                "org_id": org_id,
            })
            
    def set_extra_context(self, key: str, value: Any):
        """Set extra context for error reporting"""
        if self.sentry_initialized and SENTRY_AVAILABLE:
            sentry_sdk.set_extra(key, value)
            
    def set_tag(self, key: str, value: str):
        """Set a tag for error reporting"""
        if self.sentry_initialized and SENTRY_AVAILABLE:
            sentry_sdk.set_tag(key, value)
            
    def add_breadcrumb(self, message: str, category: str = "info", data: Optional[Dict[str, Any]] = None):
        """Add a breadcrumb for error reporting"""
        if self.sentry_initialized and SENTRY_AVAILABLE:
            sentry_sdk.add_breadcrumb(
                message=message,
                category=category,
                data=data or {},
            )
            
    def start_transaction(self, name: str, operation: str = "http.server"):
        """Start a performance transaction"""
        if self.sentry_initialized and SENTRY_AVAILABLE:
            return sentry_sdk.start_transaction(name=name, op=operation)
        return None
        
    def error_rate_limiting(self, error_type: str, max_per_minute: int = 10) -> bool:
        """Rate limit error reporting to prevent spam"""
        current_time = time.time()
        minute_ago = current_time - 60
        
        # Clean old entries
        self.error_counts = {k: v for k, v in self.error_counts.items() if v['time'] > minute_ago}
        
        if error_type not in self.error_counts:
            self.error_counts[error_type] = {'count': 1, 'time': current_time}
            return True
            
        if self.error_counts[error_type]['count'] >= max_per_minute:
            return False
            
        self.error_counts[error_type]['count'] += 1
        return True

# Global error reporting service instance
error_service = ErrorReportingService()

def capture_errors(func):
    """Decorator to capture errors and report them"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            # Rate limit error reporting
            error_type = type(e).__name__
            if error_service.error_rate_limiting(error_type):
                error_service.capture_exception(e, {
                    'function': func.__name__,
                    'module': func.__module__,
                })
            raise
    return wrapper

def track_performance(func):
    """Decorator to track function performance"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        if error_service.sentry_initialized and SENTRY_AVAILABLE:
            with sentry_sdk.start_transaction(
                name=f"{func.__module__}.{func.__name__}",
                op="function"
            ) as transaction:
                try:
                    result = await func(*args, **kwargs)
                    transaction.set_status("ok")
                    return result
                except Exception as e:
                    transaction.set_status("internal_error")
                    raise
        else:
            return await func(*args, **kwargs)
    return wrapper

# Initialize Sentry if DSN is provided
def initialize_error_reporting():
    """Initialize error reporting based on environment"""
    sentry_dsn = os.getenv("SENTRY_DSN")
    environment = os.getenv("ENVIRONMENT", "development")
    
    if sentry_dsn:
        error_service.initialize_sentry(sentry_dsn, environment)
    else:
        logger.info("SENTRY_DSN not provided, error reporting disabled")

# Initialize on module import
initialize_error_reporting() 