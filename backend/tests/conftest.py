pytest_plugins = ["pytest_asyncio"]

import pytest
from unittest.mock import Mock, AsyncMock
from cryptography.fernet import Fernet
import uuid


@pytest.fixture
def mock_supabase_client():
    """Mock Supabase client for testing."""
    mock_client = Mock()
    mock_client.table.return_value = Mock()
    return mock_client


@pytest.fixture
def mock_github_service():
    """Mock GitHub service for testing."""
    mock_service = Mock()
    mock_service.fetch_repository_data = AsyncMock()
    mock_service.is_repo_private = AsyncMock()
    return mock_service


@pytest.fixture
def mock_gpt_service():
    """Mock GPT service for testing."""
    mock_service = Mock()
    mock_service.generate_digest_summary = AsyncMock()
    return mock_service


@pytest.fixture
def sample_repo_data():
    """Sample repository data for testing."""
    return {
        "repository": {
            "full_name": "test-owner/test-repo",
        },
        "summary_counts": {
            "commits": 5,
            "prs_opened": 2,
            "prs_closed": 1,
            "issues_opened": 3,
            "issues_closed": 1,
        },
        "grouped_commits": {
            "feature": ["Add new feature", "Enhance existing feature"],
            "bugfix": ["Fix critical bug", "Patch minor issue"],
            "docs": ["Update README"],
        },
    }


@pytest.fixture
def sample_monitor_data():
    """Sample monitor data for testing."""
    return {
        "id": str(uuid.uuid4()),
        "org_id": str(uuid.uuid4()),
        "repo": "test-owner/test-repo",
        "delivery_method": "slack",
        "webhook_url": "https://hooks.slack.com/services/test",
        "frequency": "daily",
        "created_at": "2024-01-01T00:00:00Z",
        "is_private": False,
        "created_by": str(uuid.uuid4()),
        "deleted": False,
    }


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "id": str(uuid.uuid4()),
        "github_id": "12345",
        "username": "testuser",
        "email": "test@example.com",
        "access_token": "encrypted_token_here",
        "deleted": False,
        "org_id": str(uuid.uuid4()),
        "role": "admin",
    }


@pytest.fixture
def fernet_key():
    """Generate a test Fernet key for encryption testing."""
    return Fernet.generate_key()


@pytest.fixture
def mock_env_vars(monkeypatch):
    """Set up mock environment variables for testing."""
    monkeypatch.setenv("SUPABASE_URL", "https://test.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-key")
    monkeypatch.setenv("GITHUB_TOKEN", "test-github-token")
    monkeypatch.setenv("OPENAI_API_KEY", "test-openai-key")
    monkeypatch.setenv("OPENAI_ENABLED", "true")
    monkeypatch.setenv("FERNET_KEY", Fernet.generate_key().decode())
    monkeypatch.setenv("STRIPE_SECRET_KEY", "test-stripe-key")


@pytest.fixture
def mock_httpx_client(monkeypatch):
    """Mock httpx client for HTTP requests."""
    mock_client = AsyncMock()
    mock_response = Mock()
    mock_response.json.return_value = {"test": "data"}
    mock_response.raise_for_status.return_value = None
    mock_client.get.return_value = mock_response
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None
    return mock_client
