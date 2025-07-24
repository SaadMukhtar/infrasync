# Multi-stage build for security and optimization
FROM public.ecr.aws/lambda/python:3.11 as builder

# Install system dependencies
RUN yum update -y && \
    yum install -y gcc && \
    yum clean all && \
    rm -rf /var/cache/yum

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Production stage
FROM public.ecr.aws/lambda/python:3.11

# Create non-root user for security
RUN groupadd -r lambda && useradd -r -g lambda lambda

# Copy dependencies from builder stage
COPY --from=builder /var/lang/lib/python3.11/site-packages ${LAMBDA_TASK_ROOT}/lib/python3.11/site-packages

# Copy application code
COPY lambda_function.py ${LAMBDA_TASK_ROOT}

# Set proper permissions
RUN chown -R lambda:lambda ${LAMBDA_TASK_ROOT} && \
    chmod -R 755 ${LAMBDA_TASK_ROOT}

# Switch to non-root user
USER lambda

# Define the Lambda handler
CMD ["lambda_function.lambda_handler"]
