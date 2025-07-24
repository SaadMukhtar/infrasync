# Infrasync - Scheduled Digest Lambda

This AWS Lambda runs on a schedule (daily or weekly) to trigger GPT-powered GitHub digests via the `/digest` endpoint in the Infrasync backend.

## 📦 What It Does

- **Fetches only active (non-deleted) monitors** from Supabase
- **Automatically cleans up deleted monitors** that are older than 30 days (compliance requirement)
- **Triggers digest generation** for each active monitor
- **Supports daily/weekly delivery** via Slack, Discord, or Email
- **Comprehensive logging** without exposing sensitive data

## 🔧 Key Features

### Monitor Filtering

- Only processes monitors where `deleted = false`
- Skips monitors with frequency other than "daily" or "weekly"

### Data Cleanup

- Automatically removes monitors that have been soft-deleted for over 30 days
- Maintains compliance with data retention policies
- Logs cleanup activities for audit purposes

### Enhanced Logging

- Structured logging with timestamps and log levels
- No sensitive data (API keys, webhook URLs) in logs
- Success/failure tracking for each digest operation
- Detailed error reporting for troubleshooting

## 🚀 CI/CD Pipeline

This project uses a comprehensive CI/CD pipeline with enterprise-grade practices:

### Automated Workflow

- **Security Scanning**: Trivy vulnerability scanning on every commit
- **Testing**: Automated unit and integration tests
- **Linting**: Code quality checks with Ruff and Black
- **Building**: Multi-stage Docker builds with security optimizations
- **Deployment**: Automated deployment to AWS Lambda
- **Verification**: Post-deployment testing and validation
- **Notifications**: Slack notifications for deployment status

### Pipeline Stages

1. **Security Scan** → Vulnerability scanning with Trivy
2. **Test** → Linting, formatting, and unit tests
3. **Build** → Docker image build and push to ECR
4. **Deploy** → Lambda function update and verification
5. **Notify** → Deployment status notifications

## ⚙️ Setup

### Prerequisites

- AWS CLI configured with appropriate permissions
- Docker installed and running
- Python 3.11+ for local development

### GitHub Secrets Required

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# Lambda Function Secrets
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
BACKEND_DIGEST_ENDPOINT=https://your-backend.com/api/v1/digest

# AWS Resources
AWS_ECR_REPOSITORY=infrasync-digest-lambda

# Optional Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### Local Development

1. **Install dependencies**:

   ```bash
   cd infra/scheduled-digest-lambda
   pip install -r requirements.txt
   ```

2. **Run tests**:

   ```bash
   python -m pytest test_lambda.py -v
   ```

3. **Run linting**:

   ```bash
   ruff check .
   black . --check
   ```

4. **Test locally**:
   ```bash
   python test_lambda.py
   ```

### Manual Deployment

1. **Set environment variables**:

   ```bash
   export LAMBDA_ECR_URI=your-account.dkr.ecr.region.amazonaws.com/infrasync-digest-lambda
   export LAMBDA_NAME=infrasync-digest-lambda
   export AWS_REGION=us-east-1
   ```

2. **Deploy using the script**:

   ```bash
   chmod +x deploy-lambda.sh
   ./deploy-lambda.sh
   ```

3. **Skip tests (if needed)**:
   ```bash
   ./deploy-lambda.sh --skip-tests
   ```

### Automated Deployment (CI/CD)

The GitHub Actions workflow automatically deploys on pushes to `main`:

1. **Security scanning** with Trivy
2. **Testing** with pytest
3. **Linting** with Ruff and Black
4. **Building** and pushing Docker image to ECR
5. **Deploying** to AWS Lambda
6. **Verifying** deployment
7. **Notifying** via Slack (if configured)

## 🧪 Testing

### Test Structure

- **Unit Tests**: Individual function testing with mocks
- **Integration Tests**: End-to-end workflow testing
- **Security Tests**: Vulnerability scanning
- **Deployment Tests**: Post-deployment verification

### Running Tests

```bash
# Run all tests
python -m pytest test_lambda.py -v

# Run specific test class
python -m pytest test_lambda.py::TestLambdaFunction -v

# Run with coverage
python -m pytest test_lambda.py --cov=lambda_function --cov-report=html
```

## 🔒 Security Features

### Docker Security

- Multi-stage builds to reduce attack surface
- Non-root user execution
- Minimal base image
- Regular security updates

### Code Security

- No secrets in logs
- Input validation
- Error handling without information leakage
- Dependency vulnerability scanning

### AWS Security

- Least privilege IAM policies
- ECR image scanning
- Lambda execution role isolation

## 📊 Monitoring & Logging

### CloudWatch Logs

The lambda function provides structured logging:

```
2024-01-15 13:00:00,123 - INFO - Digest Lambda triggered at 2024-01-15T13:00:00.123Z
2024-01-15 13:00:00,124 - INFO - Found 0 deleted monitors to permanently remove
2024-01-15 13:00:00,125 - INFO - Cleanup completed - removed 0 old deleted monitors
2024-01-15 13:00:00,126 - INFO - Found 5 active monitors for digest processing
2024-01-15 13:00:00,127 - INFO - Triggering digest for repo: owner/repo (delivery: slack)
2024-01-15 13:00:00,128 - INFO - Successfully triggered digest for owner/repo
2024-01-15 13:00:00,129 - INFO - Digest processing complete - Success: 5, Failed: 0
2024-01-15 13:00:00,130 - INFO - Lambda execution completed successfully
```

### Metrics

- Success/failure counts
- Processing time
- Monitor counts
- Cleanup statistics

## 📁 Project Structure

```
infra/scheduled-digest-lambda/
├── lambda_function.py      # Main lambda function
├── test_lambda.py          # Comprehensive test suite
├── requirements.txt        # Python dependencies
├── Dockerfile             # Multi-stage Docker build
├── deploy-lambda.sh       # Deployment script
├── lambda-config.json     # Lambda configuration template
├── SECRETS-MANAGEMENT.md  # Secrets management guide
└── README.md              # This file
```

## 🔧 Configuration

### Lambda Configuration

- **Runtime**: Python 3.11
- **Architecture**: x86_64
- **Memory**: 256 MB (configurable)
- **Timeout**: 5 minutes (configurable)
- **Concurrency**: 10 (configurable)

### Environment Variables

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BACKEND_DIGEST_ENDPOINT=https://your-backend.com/api/v1/digest
RETENTION_DAYS=30
LOG_LEVEL=INFO
```

### Scheduling

Configure EventBridge rules for scheduling:

- **Daily**: `cron(0 13 * * ? *)` (1 PM UTC)
- **Weekly**: `cron(0 13 ? * MON *)` (Monday 1 PM UTC)

## 🚨 Troubleshooting

### Common Issues

1. **Lambda timeout**:

   - Increase timeout in Lambda configuration
   - Check network connectivity to Supabase and backend

2. **Permission errors**:

   - Verify IAM roles and policies
   - Check ECR repository permissions

3. **Test failures**:
   - Ensure all dependencies are installed
   - Check environment variables are set

### Debug Mode

Enable debug logging by setting log level:

```python
logging.basicConfig(level=logging.DEBUG)
```

## 📈 Performance Optimization

### Lambda Optimization

- **Cold start reduction**: Keep dependencies minimal
- **Memory optimization**: Use appropriate memory allocation
- **Concurrency**: Configure based on expected load

### Database Optimization

- **Indexing**: Ensure proper indexes on `deleted` and `deleted_at` columns
- **Batch processing**: Process monitors in batches if needed
- **Connection pooling**: Use connection pooling for database connections

## 🔄 Version Management

### Image Tagging

- **latest**: Always points to the most recent deployment
- **v-{commit-sha}**: Versioned tags for rollback capability
- **v-{semver}**: Semantic versioning for releases

### Rollback Process

```bash
# Rollback to specific version
aws lambda update-function-code \
  --function-name infrasync-digest-lambda \
  --image-uri your-ecr-uri:infrasync-digest-lambda:v-abc123
```

## 📋 Compliance & Best Practices

### Data Retention

- 30-day retention for deleted monitors (configurable)
- Audit logging for all cleanup operations
- Compliance with GDPR and data protection regulations

### Security Best Practices

- No secrets in code or logs
- Regular security scanning
- Principle of least privilege
- Secure coding practices

### Operational Excellence

- Comprehensive testing
- Automated deployment
- Monitoring and alerting
- Documentation and runbooks

## 📞 Support

For issues or questions:

1. Check the troubleshooting section
2. Review CloudWatch logs
3. Run the test suite locally
4. Check GitHub Actions for deployment issues

## 📄 License

This project is part of Infrasync and follows the same licensing terms.
