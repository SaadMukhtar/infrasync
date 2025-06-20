# Contributing to Infrasync

Welcome! 🚀 We’re excited that you want to contribute to Infrasync—a modern, open source SaaS platform for developers, teams, and organizations. Whether you’re fixing a bug, adding a feature, improving docs, or just asking a question, your input is valued.

---

## 🤝 Our Values

- **Quality:** We strive for robust, maintainable, and secure code.
- **Collaboration:** We believe in open, constructive feedback and teamwork.
- **Inclusivity:** All are welcome. We expect kindness and respect in all interactions.
- **Transparency:** Decisions, discussions, and code are open by default.

---

## 📝 Code of Conduct

By participating, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Be kind, constructive, and inclusive.

---

## 🛠️ How to Contribute

### 1. **Open an Issue**

- Found a bug? Have a feature request? [Open an issue](https://github.com/SaadMukhtar/infrasync/issues).
- Please search existing issues before creating a new one.
- Use clear, descriptive titles and provide as much context as possible.

### 2. **Fork & Clone**

```bash
git clone https://github.com/SaadMukhtar/infrasync.git
cd infrasync
git checkout -b your-feature-branch
```

### 3. **Set Up Locally**

See the [README](README.md) for setup instructions for both backend and frontend.

### 4. **Make Your Changes**

- Follow our [coding standards](#coding-standards).
- Write clear, maintainable, and well-tested code.
- Add or update documentation as needed.

### 5. **Run Tests & Lint**

- **Backend:**
  ```bash
  cd backend
  pytest
  ./../scripts/lint.sh
  ```
- **Frontend:**
  ```bash
  cd frontend
  npm run lint
  npm run typecheck
  npm test
  ```

### 6. **Commit & Push**

- Use clear, conventional commit messages (see below).
- Push your branch to your fork.

### 7. **Open a Pull Request**

- Go to the GitHub repo and open a PR from your branch.
- Fill out the PR template and link any relevant issues.
- Be ready to discuss and iterate—feedback is part of the process!

---

## 🧑‍💻 Coding Standards

- **Backend:** Python 3.11+, type annotations, PEP8, FastAPI best practices.
- **Frontend:** React 18, TypeScript, functional components, hooks, Prettier formatting.
- **Security:** Never commit secrets or credentials. Use SSM Parameter Store for all sensitive config.
- **Tests:** All new features and bugfixes should include tests.
- **Docs:** Update or add documentation for any user-facing or API changes.

---

## 📝 Commit Message Guidelines

- Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):
  - `feat: add new feature`
  - `fix: fix a bug`
  - `docs: update documentation`
  - `refactor: code improvement`
  - `test: add or update tests`
  - `chore: tooling or infra changes`
- Example: `feat(auth): add support for cross-domain cookies`

---

## 🧪 Running Tests

- **Backend:** `pytest` (unit/integration tests)
- **Frontend:** `npm test` (Jest/React Testing Library)
- **Linting:** `./scripts/lint.sh` (backend), `npm run lint` (frontend)

---

## 💬 Getting Help

- **Questions?** Open a [GitHub Discussion](https://github.com/SaadMukhtar/infrasync/discussions) or [issue](https://github.com/SaadMukhtar/infrasync/issues).
- **Security issues?** Please email [saadmukhtar01@gmail.com](mailto:saadmukhtar01@gmail.com) privately.

---

## 🙏 Thank You

Your contributions make Infrasync better for everyone. We’re grateful for your time, ideas, and code!
