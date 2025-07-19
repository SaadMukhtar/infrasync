# Infrasync 🚀

[![CI/CD](https://github.com/SaadMukhtar/infrasync/actions/workflows/backend.yml/badge.svg)](https://github.com/SaadMukhtar/infrasync/actions)

A modern, open source, multi-tenant SaaS for GitHub repository monitoring, with AI-powered digests, Stripe billing, and world-class observability. Built for developers, teams, and engineering leaders.

---

## ✨ Features

- **🔐 Secure Authentication**: GitHub OAuth, JWT, org-aware RBAC
- **📊 Real-time Monitoring**: PRs, issues, commits, releases, and code changes
- **🤖 AI-Powered Digests**: GPT-generated summaries, delivered on your schedule
- **📱 Multi-Channel Delivery**: Slack, Discord, and email notifications
- **💳 Billing & Plans**: Stripe integration, free & pro plans, OSS self-hosting
- **👥 Multi-Tenant**: Org/member management, invites, roles
- **📈 Analytics & Metrics**: Prometheus metrics, usage dashboards, activity feed
- **🛡️ Production-Ready**: Security, audit logging, error handling, compliance
- **🧑‍💻 OSS & Self-Hostable**: Run in the cloud or on your own infra

---

## 🏗️ Architecture

- **Backend**: FastAPI (Python 3.11), async, type-annotated
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT for digest generation
- **Billing**: Stripe (subscription, portal, webhook sync)
- **Observability**: Prometheus, structured logging, health endpoints
- **Deployment**: Docker, production scripts, infra-as-code

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker (optional)
- Supabase account
- GitHub OAuth app
- OpenAI API key (optional)
- Stripe account (for SaaS mode)

### Backend Setup

```bash
cd backend
cp env.example .env
# Edit .env with your config (Supabase, Stripe, OpenAI, etc)
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
# Create .env.local with VITE_API_BASE_URL
npm run dev
```

---

## 💳 Billing & Plans

- **Stripe Integration**: SaaS mode with free & pro plans, managed via Stripe Billing Portal
- **Free Tier**: Generous limits for open source and small teams
- **Pro Plan**: Scales for orgs, supports project sustainability
- **OSS/Self-Hosting**: Unlimited usage for self-hosted/internal orgs, no artificial restrictions
- **Plan Enforcement**: Usage limits, upgrade flows, and Stripe webhook sync
- **Legal**: Honest, developer-friendly terms ([Terms](./frontend/src/pages/TermsOfService.tsx), [Privacy](./frontend/src/pages/PrivacyPolicy.tsx), [Cookie](./frontend/src/pages/CookiePolicy.tsx))

---

## 📊 Observability & Monitoring

- **Prometheus Metrics**: `/metrics` endpoint for all key business and system metrics
- **Health Endpoints**: `/health` for liveness/readiness, DB, and third-party checks
- **Structured Logging**: JSON logs, correlation IDs, error tracking
- **Alerting**: Prometheus alert rules (see `backend/monitoring/rules/alerts.yml`)
- **Dashboards**: Usage, activity, and trend charts in the frontend

---

## 🛡️ Security & Compliance

- **Role-Based Access**: Org-aware RBAC, JWT, secure session management
- **Audit Logging**: All critical actions logged for compliance
- **Soft Deletion**: 30-day retention for org/user deletion
- **Data Encryption**: Tokens encrypted at rest
- **Legal Pages**: Terms, Privacy, Cookie Policy, and GDPR-ready
- **Cookie Policy**: Only essential cookies by default, privacy-first

---

## 🧑‍💻 Open Source & Self-Hosting

- **MIT Licensed**: Use, modify, and deploy freely
- **Self-Hostable**: Run on your own infra, unlimited usage for internal orgs
- **Contributions Welcome**: See [CONTRIBUTING.md] or open an issue/PR
- **No Lock-In**: All features available for OSS users
- **SaaS & OSS from the Same Codebase**: The same codebase powers both the hosted SaaS and self-hosted deployments, with no artificial restrictions.
- **Cloud-Native by Default**: Designed for easy deployment to AWS, but portable to any cloud or on-prem.

---

## 🚀 CI/CD & Cloud-Native Deployment

- **Automated CI/CD**: GitHub Actions for linting, typechecking, testing, and zero-downtime deploys.
- **Immutable Deploys**: Every commit builds a new Docker image, tagged and deployed to AWS ECS Fargate.
- **Secrets Management**: All runtime secrets are injected securely from AWS SSM Parameter Store—never in code or CI logs.
- **Scalable & Secure**: Runs behind an AWS Application Load Balancer with HTTPS, health checks, and centralized logging.
- **OSS-Friendly**: Anyone can fork and deploy with their own secrets and infra.
- **How to Deploy**:
  1. Fork/clone the repo.
  2. Set up AWS resources (ECR, ECS, SSM, ALB, etc.).
  3. Add your AWS and deploy secrets to GitHub repo secrets.
  4. Push to `main`—your app is live, with zero manual steps.
- **See `.github/workflows/` for full pipeline details.**

---

## 🔑 Secrets & Configuration

- **All sensitive config (API keys, DB credentials, etc.) are managed via AWS SSM Parameter Store or Secrets Manager.**
- **No secrets are ever stored in code or in GitHub Actions logs.**
- **To self-host:**
  - Create the required secrets in SSM Parameter Store (see `env.example` for a list).
  - Reference them in your ECS task definition as shown in `ecs-task-def.json`.
  - Only non-sensitive config (like `ENVIRONMENT`, `FRONTEND_URL`) is set as plain environment variables.

---

## 🏆 Why Infrasync Stands Out

- **Real-World SaaS Patterns**: Multi-tenant, billing, metrics, audit, RBAC
- **Production-Ready**: Security, error handling, observability, compliance
- **Modern Stack**: FastAPI, React, Stripe, OpenAI, Supabase, Prometheus
- **Ideal for Teams & Orgs**: Org management, audit logging, and real-time delivery

---

## 🧑‍🔬 For All Developers

- **Easy Onboarding**: GitHub login, org creation/join, clear UI
- **Transparent Usage**: Honest billing, no dark patterns
- **Open Source First**: Community-driven, feedback welcome
- **Modern UI/UX**: Responsive, accessible, and beautiful

---

## 🛠️ Dev & Ops

- **Dockerized**: One-command deploys for backend/frontend
- **Infra Scripts**: See `infra/` for deployment, monitoring, and DNS setup
- **Prometheus**: Drop-in metrics, ready for Grafana dashboards
- **CI/CD Ready**: Easy to integrate with your pipelines
- **AWS-Ready**: ECS Fargate, SSM Parameter Store, ALB, and CloudWatch logging out of the box

---

## 📝 Legal & Compliance

- **Terms of Service**: [View](./frontend/src/pages/TermsOfService.tsx)
- **Privacy Policy**: [View](./frontend/src/pages/PrivacyPolicy.tsx)
- **Cookie Policy**: [View](./frontend/src/pages/CookiePolicy.tsx)
- **Contact**: saadmukhtar01@gmail.com

---

## 🤝 Contributing

- **Open to All**: Issues, PRs, and feedback welcome
- **Code of Conduct**: Be kind, constructive, and inclusive
- **Good First Issues**: See the issue tracker

---

## 📣 Acknowledgements

- **Stripe** for billing
- **Supabase** for the database
- **OpenAI** for GPT digests
- **Prometheus** for metrics
- **All OSS contributors**

---

**Infrasync is built for the next generation of developer tools. OSS, honest, and production-grade.**

---

## 🚀 How to Deploy to AWS (Quick Checklist)

1. **Fork/clone this repo**
2. **Set up AWS resources:**
   - ECR (for Docker images)
   - ECS Cluster & Service (Fargate)
   - SSM Parameter Store (for secrets)
   - Application Load Balancer (for stable DNS/SSL)
3. **Add GitHub repo secrets:**
   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ECR_REGISTRY`, `AWS_ECR_REPOSITORY`, `AWS_ECS_CLUSTER`, `AWS_ECS_SERVICE`, `AWS_REGION`
4. **Create SSM parameters for all required secrets** (see `env.example`)
5. **Push to `main`**
6. **Your app is live!**

---

## 💼 For Recruiters & Engineering Managers

Infrasync is built to showcase modern SaaS and OSS engineering:

- **Cloud-native, secure, and scalable**: Follows best practices used by top tech companies.
- **Automated, auditable, and maintainable**: CI/CD, secrets management, and observability are first-class.
- **Easy to fork, extend, and contribute**: Designed for both enterprise and community adoption.

---
