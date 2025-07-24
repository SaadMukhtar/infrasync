# Lambda Deployment Guide

This guide provides step-by-step instructions for deploying the Infrasync Digest Lambda function with enterprise-grade practices.

## 🚀 Quick Start

### Prerequisites Checklist

- [ ] AWS CLI installed and configured
- [ ] Docker installed and running
- [ ] Python 3.11+ installed
- [ ] GitHub repository with CI/CD secrets configured
- [ ] AWS ECR repository created
- [ ] AWS Lambda function created
- [ ] EventBridge rule configured for scheduling

### Required AWS Resources

1. **ECR Repository**

   ```bash
   aws ecr create-repository \
     --repository-name infrasync-digest-lambda \
     --region us-east-1
   ```

2. **Lambda Function**

   ```bash
   aws lambda create-function \
     --function-name infrasync-digest-lambda \
     --package-type Image \
     --code ImageUri=your-account.dkr.ecr.us-east-1.amazonaws.com/infrasync-digest-lambda:latest \
     --role arn:aws:iam::your-account:role/lambda-execution-role \
     --region us-east-1
   ```

3. **EventBridge Rule**
   ```bash
   aws events put-rule \
     --name infrasync-daily-digest \
     --schedule-expression "cron(0 13 * * ? *)" \
     --region us-east-1
   ```

## 🔧 Configuration

### Environment Variables

Set these environment variables in your Lambda function:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BACKEND_DIGEST_ENDPOINT=https://your-backend.com/api/v1/digest
```

### IAM Permissions

Your Lambda execution role needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage"
      ],
      "Resource": "*"
    }
  ]
}
```

### Lambda Configuration

Recommended settings:

- **Memory**: 256 MB
- **Timeout**: 5 minutes
- **Architecture**: x86_64
- **Concurrency**: 10 (adjust based on expected load)

## 🚀 Deployment Methods

### Method 1: Automated CI/CD (Recommended)

1. **Configure GitHub Secrets**:

   ```bash
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_ECR_REPOSITORY=infrasync-digest-lambda
   SLACK_WEBHOOK_URL=your-slack-webhook (optional)
   ```

2. **Push to main branch**:

   ```bash
   git push origin main
   ```

3. **Monitor deployment**:
   - Check GitHub Actions tab
   - Verify Lambda function is updated
   - Check CloudWatch logs

### Method 2: Manual Deployment

1. **Set environment variables**:

   ```bash
   export LAMBDA_ECR_URI=your-account.dkr.ecr.region.amazonaws.com/infrasync-digest-lambda
   export LAMBDA_NAME=infrasync-digest-lambda
   export AWS_REGION=us-east-1
   ```

2. **Run deployment script**:
   ```bash
   cd infra/scheduled-digest-lambda
   chmod +x deploy-lambda.sh
   ./deploy-lambda.sh
   ```

### Method 3: AWS CLI Direct

1. **Build and push image**:

   ```bash
   docker build -t infrasync-digest-lambda .
   docker tag infrasync-digest-lambda:latest $LAMBDA_ECR_URI:latest
   docker push $LAMBDA_ECR_URI:latest
   ```

2. **Update Lambda**:
   ```bash
   aws lambda update-function-code \
     --function-name infrasync-digest-lambda \
     --image-uri $LAMBDA_ECR_URI:latest
   ```

## 🧪 Testing

### Local Testing

1. **Run unit tests**:

   ```bash
   python -m pytest test_lambda.py -v
   ```

2. **Test locally**:

   ```bash
   python test_lambda.py
   ```

3. **Lint code**:
   ```bash
   ruff check .
   black . --check
   ```

### Post-Deployment Testing

1. **Invoke Lambda manually**:

   ```bash
   aws lambda invoke \
     --function-name infrasync-digest-lambda \
     --payload '{"test": "event"}' \
     response.json
   ```

2. **Check CloudWatch logs**:

   ```bash
   aws logs tail /aws/lambda/infrasync-digest-lambda --follow
   ```

3. **Verify function state**:
   ```bash
   aws lambda get-function --function-name infrasync-digest-lambda
   ```

## 📊 Monitoring

### CloudWatch Metrics

Monitor these key metrics:

- **Invocations**: Number of function invocations
- **Duration**: Function execution time
- **Errors**: Number of errors
- **Throttles**: Number of throttled invocations

### CloudWatch Logs

Key log patterns to monitor:

- `ERROR` level messages
- Timeout errors
- Database connection issues
- Digest processing failures

### Alerts

Set up CloudWatch alarms for:

- Error rate > 5%
- Duration > 4 minutes
- Throttle rate > 0
- Memory utilization > 80%

## 🔒 Security

### Security Checklist

- [ ] Lambda function uses least privilege IAM role
- [ ] Environment variables are encrypted
- [ ] No secrets in code or logs
- [ ] Regular security scanning enabled
- [ ] Dependencies are up to date
- [ ] Network access is restricted if needed

### Security Best Practices

1. **Use AWS Secrets Manager** for sensitive data:

   ```bash
   aws secretsmanager create-secret \
     --name infrasync/lambda/secrets \
     --secret-string '{"SUPABASE_SERVICE_ROLE_KEY":"your-key"}'
   ```

2. **Enable VPC** if needed for network isolation

3. **Use resource-based policies** for fine-grained access control

4. **Regular security audits** with automated scanning

## 🚨 Troubleshooting

### Common Issues

#### Lambda Timeout

```bash
# Increase timeout
aws lambda update-function-configuration \
  --function-name infrasync-digest-lambda \
  --timeout 300
```

#### Permission Errors

```bash
# Check IAM role
aws lambda get-function --function-name infrasync-digest-lambda \
  --query 'Configuration.Role'
```

#### Image Pull Errors

```bash
# Verify ECR permissions
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com
```

### Debug Mode

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Rollback Process

1. **List available versions**:

   ```bash
   aws ecr describe-images \
     --repository-name infrasync-digest-lambda \
     --query 'imageDetails[*].imageTags'
   ```

2. **Rollback to previous version**:
   ```bash
   aws lambda update-function-code \
     --function-name infrasync-digest-lambda \
     --image-uri your-ecr-uri:infrasync-digest-lambda:v-previous-commit
   ```

## 📈 Performance Optimization

### Lambda Optimization

1. **Memory allocation**: Increase memory for better CPU performance
2. **Concurrency**: Set appropriate concurrency limits
3. **Cold starts**: Keep dependencies minimal
4. **Connection reuse**: Use connection pooling for external services

### Database Optimization

1. **Indexes**: Ensure proper indexes on `deleted` and `deleted_at` columns
2. **Batch processing**: Process monitors in batches if needed
3. **Connection pooling**: Use connection pooling for database connections

## 🔄 Maintenance

### Regular Tasks

- [ ] Weekly dependency updates
- [ ] Monthly security scans
- [ ] Quarterly performance reviews
- [ ] Annual compliance audits

### Backup and Recovery

1. **Function configuration backup**:

   ```bash
   aws lambda get-function --function-name infrasync-digest-lambda > backup.json
   ```

2. **Image backup**:
   ```bash
   docker pull your-ecr-uri:infrasync-digest-lambda:latest
   docker save infrasync-digest-lambda:latest > backup.tar
   ```

## 📞 Support

### Getting Help

1. **Check logs**: CloudWatch logs for error details
2. **Run tests**: Local test suite for validation
3. **Review configuration**: Verify all settings are correct
4. **Check documentation**: This guide and README.md

### Escalation Path

1. Local troubleshooting
2. GitHub Issues
3. AWS Support (if applicable)
4. Team escalation

## 📋 Compliance

### Data Protection

- 30-day retention for deleted monitors
- Audit logging for all operations
- GDPR compliance measures
- Data encryption at rest and in transit

### Security Standards

- SOC 2 compliance measures
- Regular security assessments
- Vulnerability management
- Access control and monitoring

---

**Last Updated**: July 2025
**Version**: 1.0
**Maintainer**: Infrasync Team
