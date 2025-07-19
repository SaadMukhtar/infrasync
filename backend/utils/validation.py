import re
import logging
from typing import Dict, Any, Tuple
from urllib.parse import urlparse
import email_validator  # type: ignore

logger = logging.getLogger(__name__)


class ValidationError(Exception):
    """Custom validation error"""

    pass


def validate_repo_format(repo: str) -> bool:
    """Validate GitHub repository format (owner/repo)"""
    if not repo or not isinstance(repo, str):
        return False

    # Check format: owner/repo
    parts = repo.split("/")
    if len(parts) != 2:
        return False

    owner, repo_name = parts

    # GitHub username/repo validation rules
    if not owner or not repo_name:
        return False

    # Username: 1-39 characters, alphanumeric and hyphens
    if not re.match(r"^[a-zA-Z0-9-]{1,39}$", owner):
        return False

    # Repo name: 1-100 characters, alphanumeric, hyphens, underscores, dots
    if not re.match(r"^[a-zA-Z0-9._-]{1,100}$", repo_name):
        return False

    return True


def validate_webhook_url(url: str, delivery_method: str) -> bool:
    """Validate webhook URL based on delivery method"""
    if not url or not isinstance(url, str):
        return False

    try:
        parsed = urlparse(url)

        if delivery_method == "slack":
            # Slack webhook URLs
            return (
                parsed.scheme in ["https"]
                and parsed.netloc.endswith(".slack.com")
                and "/services/" in parsed.path
            )
        elif delivery_method == "discord":
            # Discord webhook URLs
            return (
                parsed.scheme in ["https"]
                and parsed.netloc == "discord.com"
                and "/api/webhooks/" in parsed.path
            )
        elif delivery_method == "email":
            # Email validation
            return validate_email(url)
        else:
            return False

    except Exception:
        return False


def validate_email(email: str) -> bool:
    """Validate email address"""
    try:
        email_validator.validate_email(email)
        return True
    except email_validator.EmailNotValidError:
        return False


def validate_frequency(frequency: str) -> bool:
    """Validate digest frequency"""
    valid_frequencies = ["daily", "weekly", "on_merge"]
    return frequency in valid_frequencies


def sanitize_string(value: str, max_length: int = 1000) -> str:
    """Sanitize string input"""
    if not isinstance(value, str):
        raise ValidationError("Value must be a string")

    # Remove null bytes and control characters
    sanitized = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", value)

    # Limit length
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length]

    return sanitized.strip()


def validate_monitor_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate monitor creation/update data"""
    errors = []

    # Required fields
    if "repo" not in data:
        errors.append("Repository is required")
    elif not validate_repo_format(data["repo"]):
        errors.append("Invalid repository format. Use 'owner/repo'")

    if "delivery_method" not in data:
        errors.append("Delivery method is required")
    elif data["delivery_method"] not in ["slack", "discord", "email"]:
        errors.append("Invalid delivery method")

    # Optional fields with validation
    if "frequency" in data and not validate_frequency(data["frequency"]):
        errors.append("Invalid frequency")

    if "webhook_url" in data and data["webhook_url"]:
        if not validate_webhook_url(
            data["webhook_url"], data.get("delivery_method", "")
        ):
            errors.append("Invalid webhook URL for the specified delivery method")

    if errors:
        raise ValidationError(f"Validation errors: {', '.join(errors)}")

    return data


def validate_digest_request(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate digest request data"""
    errors = []

    # Required fields
    if "repo" not in data:
        errors.append("Repository is required")
    elif not validate_repo_format(data["repo"]):
        errors.append("Invalid repository format. Use 'owner/repo'")

    if "delivery_method" not in data:
        errors.append("Delivery method is required")
    elif data["delivery_method"] not in ["slack", "discord", "email"]:
        errors.append("Invalid delivery method")

    # Conditional validation
    if data.get("delivery_method") in ["slack", "discord"]:
        if "webhook_url" not in data or not data["webhook_url"]:
            errors.append("Webhook URL is required for Slack/Discord delivery")
        elif not validate_webhook_url(data["webhook_url"], data["delivery_method"]):
            errors.append("Invalid webhook URL")

    elif data.get("delivery_method") == "email":
        if "email" not in data or not data["email"]:
            errors.append("Email address is required for email delivery")
        elif not validate_email(data["email"]):
            errors.append("Invalid email address")

    if errors:
        raise ValidationError(f"Validation errors: {', '.join(errors)}")

    return data


def validate_org_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate organization data"""
    errors = []

    if "name" in data:
        name = sanitize_string(data["name"], max_length=100)
        if not name:
            errors.append("Organization name cannot be empty")
        data["name"] = name

    if errors:
        raise ValidationError(f"Validation errors: {', '.join(errors)}")

    return data


def validate_user_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate user data"""
    errors = []

    if "email" in data:
        if not validate_email(data["email"]):
            errors.append("Invalid email address")

    if "username" in data:
        username = sanitize_string(data["username"], max_length=50)
        if not re.match(r"^[a-zA-Z0-9_-]{3,50}$", username):
            errors.append(
                "Username must be 3-50 characters, alphanumeric, hyphens, underscores only"
            )
        data["username"] = username

    if errors:
        raise ValidationError(f"Validation errors: {', '.join(errors)}")

    return data


def sanitize_sql_input(value: str) -> str:
    """Sanitize input to prevent SQL injection"""
    # Remove SQL injection patterns
    sql_patterns = [
        r"(\b(union|select|insert|update|delete|drop|create|alter)\b)",
        r"(\b(or|and)\b\s+\d+\s*=\s*\d+)",
        r"(--|#|/\*|\*/)",
        r"(\b(exec|execute|script)\b)",
        r"(\b(union|select|insert|update|delete|drop|create|alter)\b)",
    ]

    sanitized = value
    for pattern in sql_patterns:
        sanitized = re.sub(pattern, "", sanitized, flags=re.IGNORECASE)

    return sanitized


def validate_pagination_params(page: int = 1, limit: int = 10) -> Tuple[int, int]:
    """Validate pagination parameters"""
    if page < 1:
        page = 1
    if limit < 1 or limit > 100:
        limit = 10

    return page, limit


def validate_date_range(start_date: str, end_date: str) -> bool:
    """Validate date range format"""
    try:
        from datetime import datetime

        datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        datetime.fromisoformat(end_date.replace("Z", "+00:00"))
        return True
    except ValueError:
        return False
