#!/bin/bash

# === CONFIGURATION ===
LAMBDA_ECR_URI="${LAMBDA_ECR_URI:?LAMBDA_ECR_URI must be set}"
LAMBDA_NAME="${LAMBDA_NAME:?LAMBDA_NAME must be set}"
IMAGE_TAG="latest"

# === STEP 0: Authenticate with ECR ===
echo "[0/4] Logging into ECR..."
aws ecr get-login-password | docker login --username AWS --password-stdin $(echo $LAMBDA_ECR_URI | cut -d'/' -f1) || {
  echo "❌ ECR login failed. Aborting."
  exit 1
}

# === STEP 1: Build Docker Image ===
echo "[1/4] Building Docker image..."
docker buildx build --platform linux/amd64 -t infrasync-digest-lambda . || {
  echo "❌ Docker build failed. Aborting."
  exit 1
}

# === STEP 2: Tag and Push to ECR ===
echo "[2/4] Tagging and pushing to ECR..."
docker tag infrasync-digest-lambda:latest $LAMBDA_ECR_URI:$IMAGE_TAG

docker push $LAMBDA_ECR_URI:$IMAGE_TAG || {
  echo "❌ Docker push failed. Aborting."
  exit 1
}

# === STEP 3: Update Lambda to Use New Image ===
echo "[3/4] Updating Lambda function..."
aws lambda update-function-code \
  --function-name $LAMBDA_NAME \
  --image-uri $LAMBDA_ECR_URI:$IMAGE_TAG || {
    echo "❌ Lambda update failed. Aborting."
    exit 1
  }

# === STEP 4: Confirm Deployment ===
echo "[4/4] Confirming deployed image URI..."
LATEST_IMAGE=$(aws lambda get-function --function-name $LAMBDA_NAME \
  --query 'Code.ImageUri' --output text)

echo "✅ Lambda updated successfully."
echo "🚀 Currently deployed image: $LATEST_IMAGE"
