# Infrasync 🚀

![CI](https://github.com/SaadMukhtar/infrasync/actions/workflows/frontend.yml/badge.svg)
![CI](https://github.com/SaadMukhtar/infrasync/actions/workflows/backend.yml/badge.svg)

A modern, open source, multi-tenant SaaS platform for GitHub repository monitoring, AI-powered digests, and world-class observability. Built for developers, teams, and engineering leaders who want actionable insights, secure authentication, and cloud-native scalability—out of the box.

---

## 🌟 Why Infrasync?

- **Stay in sync with your codebase:** Get AI-generated digests of PRs, issues, and releases delivered to Slack, Discord, or email.
- **Multi-tenant, org-aware:** Manage teams, orgs, and roles with secure, scalable RBAC.
- **SaaS-ready, OSS-friendly:** Run in the cloud or self-host with a single command. Designed for startups, enterprises, and open source communities.
- **Cloud-native by default:** Built for AWS with best practices—custom domains, HTTPS, ALB, Route53, and more.
- **Developer-first:** FastAPI, React, TypeScript, and a clean, extensible codebase.

---

## ✨ Features

- **🔐 Secure Authentication:** GitHub OAuth, JWT, org-aware RBAC, cross-subdomain cookie auth
- **📊 Real-time Monitoring:** PRs, issues, commits, releases, and code changes
- **🤖 AI-Powered Digests:** GPT-generated summaries, delivered on your schedule
- **📱 Multi-Channel Delivery:** Slack, Discord, and email notifications
- **💳 Billing & Plans:** Stripe integration, free & pro plans, OSS self-hosting
- **👥 Multi-Tenant:** Org/member management, invites, roles
- **📈 Analytics & Metrics:** Prometheus metrics, usage dashboards, activity feed
- **🛡️ Production-Ready:** Security, audit logging, error handling, compliance
- **🧑‍💻 OSS & Self-Hostable:** Run in the cloud or on your own infra
- **🌐 Custom Domains:** Route53, ACM, and HTTPS for both frontend and backend
- **🚀 Zero-Downtime Deploys:** Blue/green ECS Fargate, ALB health checks, immutable Docker images

---

## 🏗️ Modern Cloud-Native Architecture

- **Frontend:** React 18, TypeScript, Tailwind CSS, hosted on S3 + CloudFront, custom domain via Route53/ACM (e.g., `https://infrasync.ca`)
- **Backend:** FastAPI (Python 3.11+), async, type-annotated, deployed on ECS Fargate behind an Application Load Balancer (ALB) with custom domain (e.g., `https://api.infrasync.ca`)
- **Database:** Supabase (PostgreSQL)
- **AI:** OpenAI GPT for digest generation
- **Billing:** Stripe (subscription, portal, webhook sync)
- **Observability:** Prometheus, structured logging, health endpoints
- **Deployment:** Docker, GitHub Actions, AWS SSM Parameter Store for secrets, Route53 for DNS, ACM for SSL
- **Serverless:** Scheduled digests via AWS Lambda (with VPC/NAT support)

---

## 💳 Billing & Plans

- **Stripe Integration:** SaaS-ready with free & pro plans, managed via Stripe Billing Portal.
- **Free Tier:** Generous limits for open source and small teams.
- **Pro Plan:** Scales for orgs, supports project sustainability.
- **OSS/Self-Hosting:** Unlimited usage for self-hosted/internal orgs, no artificial restrictions.
- **Plan Enforcement:** Usage limits, upgrade flows, and Stripe webhook sync.
- **Legal:** Honest, developer-friendly terms ([Terms](./frontend/src/pages/TermsOfService.tsx), [Privacy](./frontend/src/pages/PrivacyPolicy.tsx), [Cookie](./frontend/src/pages/CookiePolicy.tsx)).

---

## 📊 Observability & Monitoring

- **Prometheus Metrics:** `/metrics` endpoint for all key business and system metrics.
- **Health Endpoints:** `/health` for liveness/readiness, DB, and third-party checks.
- **Structured Logging:** JSON logs, correlation IDs, error tracking.
- **Alerting:** Prometheus alert rules (see `backend/monitoring/rules/alerts.yml`).
- **Dashboards:** Usage, activity, and trend charts in the frontend.

---

## 🛡️ Security & Compliance

- **Role-Based Access:** Org-aware RBAC, JWT, secure session management.
- **Audit Logging:** All critical actions logged for compliance.
- **Soft Deletion:** 30-day retention for org/user deletion.
- **Data Encryption:** Tokens encrypted at rest.
- **Legal Pages:** Terms, Privacy, Cookie Policy, and GDPR-ready.
- **Cookie Policy:** Only essential cookies by default, privacy-first.

---

## 🧑‍💻 Open Source & Self-Hosting

- **MIT Licensed:** Use, modify, and deploy freely.
- **Self-Hostable:** Run on your own infra, unlimited usage for internal orgs.
- **Contributions Welcome:** See [CONTRIBUTING.md] or open an issue/PR.
- **No Lock-In:** All features available for OSS users.
- **SaaS & OSS from the Same Codebase:** The same codebase powers both the hosted SaaS and self-hosted deployments, with no artificial restrictions.
- **Cloud-Native by Default:** Designed for easy deployment to AWS, but portable to any cloud or on-prem.

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker
- AWS account (for cloud deploy)
- Supabase account
- GitHub OAuth app
- OpenAI API key (optional)
- Stripe account (for SaaS mode)

### Local Development

**Backend:**

```bash
cd backend
cp env.example .env
# Edit .env with your config (Supabase, Stripe, OpenAI, etc)
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
# Create .env.local with VITE_API_BASE_URL (e.g., https://api.infrasync.ca)
npm run dev
```

---

## 🌍 Production Deployment (AWS, Custom Domains, HTTPS)

### 1. **Infrastructure**

- **Route53:** Manage DNS for your domain (e.g., `infrasync.ca`)
- **ACM:** Issue SSL certificates for `infrasync.ca` and `api.infrasync.ca`
- **S3 + CloudFront:** Host the React frontend with HTTPS and SPA routing
- **ECS Fargate + ALB:** Deploy the FastAPI backend with HTTPS, health checks, and blue/green deploys
- **SSM Parameter Store:** Store all secrets and environment variables securely
- **Lambda (optional):** For scheduled digests, ensure Lambda has VPC/NAT access if needed

### 2. **Custom Domains**

- **Frontend:** `https://infrasync.ca` (CloudFront, S3, Route53, ACM)
- **Backend:** `https://api.infrasync.ca` (ALB, ECS, Route53, ACM)
- **Cookie Auth:** Secure, cross-subdomain cookies with domain `.infrasync.ca`

### 3. **CI/CD**

- **GitHub Actions:**
  - Lint, typecheck, test, build Docker images
  - Push to ECR, update ECS task definitions with immutable tags
  - Deploy frontend to S3/CloudFront, invalidate cache
  - All secrets managed via GitHub and SSM

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

- **Real-World SaaS Patterns:** Multi-tenant, billing, metrics, audit, RBAC
- **Production-Ready:** Security, error handling, observability, compliance
- **Modern Stack:** FastAPI, React, Stripe, OpenAI, Supabase, Prometheus
- **Ideal for Teams & Orgs:** Org management, audit logging, and real-time delivery
- **Cloud-Native by Default:** Designed for AWS, but portable to any cloud or on-prem
- **OSS-Friendly:** Anyone can fork and deploy with their own secrets and infra
- **Dev Experience:** Clean code, clear docs, and a welcoming community

---

## 🧑‍💻 Contributing

We welcome contributions from developers, startups, and enterprises alike! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📚 Resources

- [Architecture Diagram](docs/architecture.md) (coming soon)
- [API Reference](docs/api.md) (coming soon)
- [Deployment Guide](docs/deployment.md) (coming soon)

---

## 📣 Get Involved

- **Star this repo** if you find it useful!
- **Open an issue** for bugs, feature requests, or questions.
- **Join the community**—PRs, feedback, and ideas are always welcome.

---

## License

[MIT](LICENSE)
