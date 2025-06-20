#!/bin/bash

# Production Deployment Script for Infrasync
# This script handles secure deployment to production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="infrasync"
DOCKER_REGISTRY="your-registry.com"
IMAGE_TAG=$(git rev-parse --short HEAD)
FULL_IMAGE_NAME="${DOCKER_REGISTRY}/${APP_NAME}:${IMAGE_TAG}"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root"
   exit 1
fi

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker is not running"
        exit 1
    fi
    
    # Check if required environment variables are set
    required_vars=("SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    success "Prerequisites check passed"
}

# Security checks
security_checks() {
    log "Running security checks..."
    
    # Check for secrets in code
    if grep -r "password\|secret\|key" --include="*.py" --include="*.js" --include="*.ts" . | grep -v "example\|test" | grep -v "config.py"; then
        warning "Potential secrets found in code"
    fi
    
    # Check for debug mode
    if [[ "$ENVIRONMENT" != "production" ]]; then
        error "Environment is not set to production"
        exit 1
    fi
    
    # Check for proper CORS settings
    if [[ "$ALLOWED_ORIGINS" == *"localhost"* ]]; then
        warning "Localhost in ALLOWED_ORIGINS for production"
    fi
    
    success "Security checks completed"
}

# Build Docker image
build_image() {
    log "Building Docker image..."
    
    # Build with security scanning
    docker build \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --tag "$FULL_IMAGE_NAME" \
        --file backend/Dockerfile \
        backend/
    
    success "Docker image built: $FULL_IMAGE_NAME"
}

# Run tests
run_tests() {
    log "Running tests..."
    
    # Run backend tests
    cd backend
    python -m pytest tests/ -v --tb=short || {
        error "Backend tests failed"
        exit 1
    }
    cd ..
    
    # Run frontend tests
    cd frontend
    npm run test -- --watchAll=false || {
        error "Frontend tests failed"
        exit 1
    }
    cd ..
    
    success "All tests passed"
}

# Deploy to production
deploy() {
    log "Deploying to production..."
    
    # Push image to registry
    docker push "$FULL_IMAGE_NAME"
    
    # Deploy using your preferred method (e.g., Kubernetes, Docker Swarm, etc.)
    # This is a placeholder - replace with your actual deployment logic
    
    # Example for Kubernetes:
    # kubectl set image deployment/infrasync-backend infrasync-backend="$FULL_IMAGE_NAME"
    # kubectl rollout status deployment/infrasync-backend
    
    # Example for Docker Swarm:
    # docker service update --image "$FULL_IMAGE_NAME" infrasync_backend
    
    success "Deployment completed"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for deployment to be ready
    sleep 30
    
    # Check health endpoint
    if curl -f http://your-production-domain.com/health; then
        success "Health check passed"
    else
        error "Health check failed"
        exit 1
    fi
}

# Rollback function
rollback() {
    log "Rolling back deployment..."
    
    # Implement rollback logic here
    # Example: kubectl rollout undo deployment/infrasync-backend
    
    warning "Rollback completed"
}

# Main deployment flow
main() {
    log "Starting production deployment for $APP_NAME"
    
    # Set trap for cleanup on exit
    trap 'error "Deployment failed"; rollback' ERR
    
    check_prerequisites
    security_checks
    build_image
    run_tests
    deploy
    health_check
    
    success "Production deployment completed successfully!"
}

# Parse command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "build")
        check_prerequisites
        build_image
        ;;
    "test")
        run_tests
        ;;
    "security")
        security_checks
        ;;
    "health")
        health_check
        ;;
    *)
        echo "Usage: $0 {deploy|build|test|security|health}"
        exit 1
        ;;
esac 