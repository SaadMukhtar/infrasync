# Multi-stage build for security and optimization
FROM public.ecr.aws/lambda/python:3.11 as builder

# Install system dependencies
RUN yum update -y && \
    yum install -y gcc && \
    yum clean all && \
    rm -rf /var/cache/yum

# Copy requirements and install Python dependencies to /opt/python
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --target /opt/python -r requirements.txt

# Production stage
FROM public.ecr.aws/lambda/python:3.11

# Copy dependencies from builder stage to Lambda's task root
COPY --from=builder /opt/python ${LAMBDA_TASK_ROOT}/

# Copy application code
COPY lambda_function.py ${LAMBDA_TASK_ROOT}

# Set proper permissions (AWS Lambda runs as root by default)
RUN chmod -R 755 ${LAMBDA_TASK_ROOT}

# Define the Lambda handler
CMD ["lambda_function.lambda_handler"]
