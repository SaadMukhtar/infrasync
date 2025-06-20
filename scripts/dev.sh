#!/bin/bash

# Infrasync Development Script
# Quick development helpers
# Usage: ./scripts/dev.sh [format|fix|check]

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_header() {
    echo -e "${BLUE}🔍 $1${NC}"
}

case "${1:-check}" in
    "format")
        print_header "Formatting code..."
        
        # Backend formatting
        cd backend
        print_header "Formatting backend with black..."
        black .
        print_status "Backend formatted"
        cd ..
        
        # Frontend formatting (if prettier is configured)
        cd frontend
        if npm run format 2>/dev/null; then
            print_status "Frontend formatted"
        else
            echo "No frontend format script found"
        fi
        cd ..
        
        print_status "All code formatted! 🎉"
        ;;
        
    "fix")
        print_header "Auto-fixing issues..."
        
        # Backend fixes
        cd backend
        print_header "Fixing backend with ruff..."
        ruff check . --fix
        print_status "Backend issues fixed"
        cd ..
        
        # Frontend fixes
        cd frontend
        print_header "Fixing frontend with eslint..."
        npm run lint -- --fix 2>/dev/null || echo "No auto-fix available for frontend"
        cd ..
        
        print_status "Auto-fixes applied! 🎉"
        ;;
        
    "check")
        print_header "Running quick checks..."
        
        # Run the full lint script
        ./scripts/lint.sh
        ;;
        
    *)
        echo "Usage: $0 [format|fix|check]"
        echo "  format - Format code with black/prettier"
        echo "  fix    - Auto-fix linting issues"
        echo "  check  - Run full linting checks (default)"
        exit 1
        ;;
esac 