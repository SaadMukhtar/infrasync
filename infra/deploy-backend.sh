#!/bin/bash

# === CONFIGURATION ===
BACKEND_ECR_URI="${BACKEND_ECR_URI:?BACKEND_ECR_URI must be set}"
BACKEND_SERVICE_NAME="${BACKEND_SERVICE_NAME:?BACKEND_SERVICE_NAME must be set}"
BACKEND_CLUSTER_NAME="${BACKEND_CLUSTER_NAME:?BACKEND_CLUSTER_NAME must be set}"
IMAGE_TAG="latest"

# === STEP 0: Authenticate with ECR ===
echo "[0/4] Logging into ECR..."
aws ecr get-login-password | docker login --username AWS --password-stdin $(echo $BACKEND_ECR_URI | cut -d'/' -f1) || {
  echo "❌ ECR login failed. Aborting."
  exit 1
}

# === STEP 1: Build Docker Image ===
echo "[1/4] Building Docker image for backend..."
docker buildx build --platform linux/amd64 -t infrasync-backend . || {
  echo "❌ Docker build failed. Aborting."
  exit 1
}

# === STEP 2: Tag and Push to ECR ===
echo "[2/4] Tagging and pushing to ECR..."
docker tag infrasync-backend:latest $BACKEND_ECR_URI:$IMAGE_TAG

docker push $BACKEND_ECR_URI:$IMAGE_TAG || {
  echo "❌ Docker push failed. Aborting."
  exit 1
}

# === STEP 3: Force ECS Service to Redeploy ===
echo "[3/4] Updating ECS service to pull new image..."
aws ecs update-service \
  --cluster $BACKEND_CLUSTER_NAME \
  --service $BACKEND_SERVICE_NAME \
  --force-new-deployment || {
    echo "❌ ECS update failed. Aborting."
    exit 1
  }

# === STEP 4: Confirm Deployment ===
echo "[4/4] Confirming service status..."
aws ecs describe-services \
  --cluster $BACKEND_CLUSTER_NAME \
  --services $BACKEND_SERVICE_NAME \
  --query 'services[0].deployments' --output table
