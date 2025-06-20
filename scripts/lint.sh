#!/bin/bash

# Infrasync Lint Script
# Runs the same lint commands as GitHub Actions
# Usage: ./scripts/lint.sh [backend|frontend|all]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${BLUE}🔍 $1${NC}"
}

# Function to run backend linting
lint_backend() {
    print_header "Running Backend Linting"
    
    cd backend
    
    # Install dependencies (same as GitHub Actions)
    echo "📦 Installing backend dependencies..."
    pip install -r requirements.txt
    pip install -r requirements-dev.txt
    
    # Run ruff (lint only) - same as GitHub Actions
    print_header "Running ruff (lint only)..."
    if ruff check .; then
        print_status "Ruff linting passed"
    else
        print_error "Ruff linting failed"
        echo "Run 'ruff check . --fix' to auto-fix issues"
        exit 1
    fi
    
    # Run black (format check only) - same as GitHub Actions
    print_header "Running black (format check only)..."
    if black . --check; then
        print_status "Black formatting check passed"
    else
        print_warning "Black formatting check failed"
        echo "Run 'black .' to auto-format code"
        exit 1
    fi
    
    cd ..
}

# Function to run frontend linting
lint_frontend() {
    print_header "Running Frontend Linting"
    
    cd frontend
    
    # Install dependencies (same as GitHub Actions)
    echo "📦 Installing frontend dependencies..."
    npm ci
    
    # Run lint - same as GitHub Actions
    print_header "Running npm run lint..."
    if npm run lint; then
        print_status "Frontend linting passed"
    else
        print_error "Frontend linting failed"
        exit 1
    fi
    
    # Run typecheck - same as GitHub Actions
    print_header "Running npm run typecheck..."
    if npm run typecheck; then
        print_status "Frontend type checking passed"
    else
        print_error "Frontend type checking failed"
        exit 1
    fi
    
    cd ..
}

# Main script logic
case "${1:-all}" in
    "backend")
        lint_backend
        ;;
    "frontend")
        lint_frontend
        ;;
    "all")
        lint_backend
        echo ""
        lint_frontend
        ;;
    *)
        echo "Usage: $0 [backend|frontend|all]"
        echo "  backend  - Run only backend linting"
        echo "  frontend - Run only frontend linting"
        echo "  all      - Run both (default)"
        exit 1
        ;;
esac

echo ""
print_status "All linting checks passed! 🎉"
echo "You're ready to push! 🚀" 