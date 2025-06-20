# Infrasync Development Scripts

Quick development helpers for the Infrasync project.

## Scripts

### `lint.sh` - Full Linting Check

Runs the same lint commands as GitHub Actions to ensure code quality.

```bash
# Run all linting (backend + frontend)
./scripts/lint.sh

# Run only backend linting
./scripts/lint.sh backend

# Run only frontend linting
./scripts/lint.sh frontend
```

**What it does:**

- Backend: ruff (linting) + black (format check)
- Frontend: eslint (linting) + TypeScript (type checking)
- Installs dependencies automatically
- Exits with error if any checks fail

### `dev.sh` - Development Helpers

Quick helpers for common development tasks.

```bash
# Run full linting checks (same as lint.sh)
./scripts/dev.sh check

# Auto-format code
./scripts/dev.sh format

# Auto-fix linting issues
./scripts/dev.sh fix
```

## Usage

**Before pushing code:**

```bash
# Quick check everything
./scripts/lint.sh

# If there are issues, auto-fix what you can
./scripts/dev.sh fix

# Then format code
./scripts/dev.sh format

# Check again
./scripts/lint.sh
```

**For quick development:**

```bash
# Just check backend
./scripts/lint.sh backend

# Just format backend
cd backend && black .
```

## Why This Approach?

- **Manual control**: You decide when to run checks
- **Fast feedback**: Catch issues before pushing
- **CI/CD parity**: Same commands as GitHub Actions
- **OSS friendly**: Easy for contributors to understand
- **Flexible**: Run full checks or just what you need

## Prerequisites

- Python 3.11+ with pip
- Node.js 20+ with npm
- Backend: `pip install -r backend/requirements-dev.txt`
- Frontend: `npm install` in frontend directory
