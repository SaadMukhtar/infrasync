# Backend Tests

This directory contains comprehensive unit tests for the Infrasync backend services.

## Test Structure

```
tests/
├── conftest.py              # Shared fixtures and test configuration
├── test_github_service.py   # GitHub API service tests
├── test_gpt_service.py      # OpenAI GPT service tests
├── test_monitor_service.py  # Monitor management service tests
├── test_user_service.py     # User management service tests
├── test_digest_service.py   # Digest creation and metrics tests
└── README.md               # This file
```

## Running Tests

### Prerequisites

Install test dependencies:

```bash
cd backend
pip install -r requirements-dev.txt
```

### Run All Tests

```bash
pytest
```

### Run Specific Test Files

```bash
# Run only GitHub service tests
pytest tests/test_github_service.py

# Run only GPT service tests
pytest tests/test_gpt_service.py

# Run only monitor service tests
pytest tests/test_monitor_service.py
```

### Run Tests with Coverage

```bash
pytest --cov=services --cov-report=html
```

### Run Tests Verbosely

```bash
pytest -v
```

### Run Only Unit Tests

```bash
pytest -m unit
```

### Run Only Integration Tests

```bash
pytest -m integration
```

## Test Coverage

### GitHub Service (`test_github_service.py`)

- ✅ Repository data fetching
- ✅ Search results fetching
- ✅ Commit message grouping
- ✅ Repository privacy checking
- ✅ Error handling for invalid formats
- ✅ HTTP error handling

### GPT Service (`test_gpt_service.py`)

- ✅ Service initialization with/without OpenAI
- ✅ Digest summary generation
- ✅ No activity handling
- ✅ OpenAI API error handling
- ✅ Environment variable parsing
- ✅ Prompt building and API calls

### Monitor Service (`test_monitor_service.py`)

- ✅ Monitor creation (public/private repos)
- ✅ Monitor retrieval and listing
- ✅ Monitor deletion and updates
- ✅ GitHub token validation
- ✅ Database operation error handling
- ✅ Organization-scoped operations

### User Service (`test_user_service.py`)

- ✅ Token encryption/decryption
- ✅ User creation and retrieval
- ✅ User reactivation (deleted users)
- ✅ Organization and role management
- ✅ User deletion validation
- ✅ Data cleanup operations

### Digest Service (`test_digest_service.py`)

- ✅ Digest creation and storage
- ✅ Metrics aggregation (with/without monitor ID)
- ✅ Digest history retrieval
- ✅ Delivery status updates
- ✅ Organization-scoped metrics
- ✅ Custom time periods and offsets

## Test Patterns

### Mocking Strategy

- **External APIs**: GitHub API, OpenAI API, Supabase
- **Database Operations**: All Supabase queries are mocked
- **Environment Variables**: Controlled via `monkeypatch` fixture
- **Async Operations**: Proper async/await testing with `pytest-asyncio`

### Fixtures

- `mock_env_vars`: Sets up test environment variables
- `sample_repo_data`: Sample GitHub repository data
- `sample_monitor_data`: Sample monitor configuration
- `sample_user_data`: Sample user information
- `fernet_key`: Test encryption key for token testing
- `mock_supabase_client`: Mocked Supabase client
- `mock_github_service`: Mocked GitHub service
- `mock_gpt_service`: Mocked GPT service

### Error Testing

- ✅ Invalid input validation
- ✅ Database operation failures
- ✅ API error responses
- ✅ Missing environment variables
- ✅ Network timeouts and errors

## Best Practices

1. **Isolation**: Each test is independent and doesn't rely on other tests
2. **Mocking**: External dependencies are properly mocked
3. **Coverage**: Tests cover both success and failure scenarios
4. **Async Testing**: Proper async/await patterns for async functions
5. **Clear Names**: Test names clearly describe what they're testing
6. **Documentation**: Each test has a descriptive docstring

## Adding New Tests

When adding new tests:

1. **Follow the naming convention**: `test_<function_name>_<scenario>`
2. **Use existing fixtures**: Leverage shared fixtures in `conftest.py`
3. **Mock external dependencies**: Don't make real API calls in tests
4. **Test both success and failure**: Cover error scenarios
5. **Add docstrings**: Explain what each test validates
6. **Use appropriate markers**: Mark tests as `unit` or `integration`

## CI/CD Integration

These tests are automatically run in the GitHub Actions CI pipeline:

- **On every PR**: Ensures code quality and prevents regressions
- **On main branch**: Validates production readiness
- **With coverage reporting**: Tracks test coverage over time

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure you're running from the `backend` directory
2. **Missing Dependencies**: Run `pip install -r requirements-dev.txt`
3. **Async Test Failures**: Check that `pytest-asyncio` is installed
4. **Mock Issues**: Verify that external dependencies are properly mocked

### Debug Mode

Run tests with more verbose output:

```bash
pytest -v -s --tb=long
```

### Test Discovery

Check which tests would be run:

```bash
pytest --collect-only
```
