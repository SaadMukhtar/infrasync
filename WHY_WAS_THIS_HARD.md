# Why Was This Hard? (Technical Challenges & Solutions)

---

## 1. Challenge: End-to-End AWS Cloud Architecture for SaaS

**Technical Detail & Rationale:**  
Deploying a modern SaaS on AWS is not just about "getting it running"—it’s about orchestrating multiple services (ECS Fargate, S3, CloudFront, ACM, Route 53, Lambda) for security, scalability, and zero-downtime. This required:

- Custom domain setup (buying, verifying, and routing via Route 53)
- SSL/TLS everywhere (ACM, CloudFront, ALB)
- Static asset hosting (S3 + CloudFront) and dynamic API (ECS Fargate + ALB)
- Secure, automated secret management (SSM Parameter Store)
- Scheduled jobs (Lambda with VPC/NAT)
- Blue/green deploys and health checks

**Solution:**

- Automated CI/CD with GitHub Actions for Docker build/push, ECS task definition, S3 sync, CloudFront invalidation.
- Used ACM for SSL, Route 53 for DNS, and set up all required DNS records and certificate validation.
- Configured ALB for static IP, HTTPS (443), forwarding rules, and security groups for ECS subnets.
- Managed secrets via SSM Parameter Store, never in code or images.
- Lambda for scheduled digests, with VPC/NAT for outbound access.
- Debugged and fixed ALB/ECS health check failures by ensuring correct security groups, subnets, and health check paths.

---

## 2. Challenge: Cross-Origin Secure Authentication (JWT, Cookies, OAuth)

**Technical Detail & Rationale:**  
In a real SaaS, the frontend (CloudFront) and backend (ALB) are on different domains. Browsers block cross-domain cookies by default, making secure, HTTP-only JWT auth with GitHub OAuth non-trivial. This is a classic, real-world SaaS pain point: how do you keep users logged in, securely, across multiple domains and environments?

**Solution:**

- Wrote a utility to dynamically set the cookie domain from `FRONTEND_URL` (e.g., `.infrasync.ca` in prod, none for localhost).
- Ensured all cookies were `Secure`, `HttpOnly`, `SameSite=Lax`, and set with the correct domain/path.
- Tuned CORS and backend redirects for seamless login/logout.
- Documented browser limitations and tradeoffs (e.g., why token-based auth is needed for true cross-origin).

---

## 3. Challenge: ALB/ECS Health Check Failures in Blue/Green Deployments

**Technical Detail & Rationale:**  
ECS deployments would roll back due to ALB health check failures, even though containers were healthy. This is a classic distributed systems challenge: security groups, subnets, and health check configuration must all be perfect, or blue/green deploys will fail and roll back, causing downtime and lost productivity.

**Solution:**

- Ensured ECS tasks always attach the correct security group.
- ALB and ECS services configured to all relevant subnets.
- Tuned health check paths, ports, and grace periods.
- Used CloudWatch and ECS logs to validate and debug.

---

## 4. Challenge: SPA Routing with S3/CloudFront

**Technical Detail & Rationale:**  
React SPA routes (e.g., `/auth/callback`) returned S3 AccessDenied XML errors when accessed directly. This is a subtle but critical issue: S3/CloudFront must be configured for SPA fallback, or deep links and OAuth callbacks will break.

**Solution:**

- Switched CloudFront origin to S3 website endpoint (not REST API endpoint).
- Configured S3 static website hosting with `index.html` as both index and error document.
- Invalidated CloudFront cache to propagate changes.
- Result: All unknown paths now serve the SPA entrypoint, fixing deep linking and OAuth callback.

---

## 5. Challenge: Role-Based Access Control (RBAC) & Multi-Tenancy

**Technical Detail & Rationale:**  
Strict org isolation and RBAC are non-negotiable for SaaS. Every API/data access must be scoped to the correct org, and privilege escalation or cross-org data leaks are catastrophic.

**Solution:**

- Made `org_id` a required parameter in all backend queries and metrics.
- Enforced RBAC in both backend and frontend.
- Wrote logic for edge cases (user removal, deleted orgs, zombie sessions).
- Used foreign key constraints with `ON DELETE SET NULL` for safe deletions.

---

## 6. Challenge: Private Repo Access & Secure Token Handling

**Technical Detail & Rationale:**  
Supporting private GitHub repos means handling user tokens securely, with correct API scopes, and never exposing secrets.

**Solution:**

- Encrypted tokens at rest using Fernet, never exposed in logs or UI.
- Required explicit user consent for private repo access.
- Scoped tokens to only the necessary permissions.

---

## 7. Challenge: Metrics, Analytics, and Hybrid Data Modeling

**Technical Detail & Rationale:**  
Storing digests as plain text limited analytics, dashboards, and usage-based billing. Needed a model that supports both display and efficient querying.

**Solution:**

- Designed a hybrid model: store both full summary text and structured metrics (JSON/JSONB).
- Enabled efficient queries for dashboards, analytics, and billing.
- Future-proofed for new metrics/features.

---

## 8. Challenge: CI/CD, Docker, and Secrets Management

**Technical Detail & Rationale:**  
Needed reproducible, secure builds and deployments with no secrets in code or images. This is essential for real-world SaaS, not just demos.

**Solution:**

- Used Docker for all services, with multi-stage builds for small images.
- GitHub Actions for CI/CD, with immutable tags and SSM for secrets.
- All secrets injected at runtime via ECS/Lambda task definitions.

---

## 9. Challenge: State Synchronization & SPA Auth Race Conditions

**Technical Detail & Rationale:**  
After login/logout, SPA sometimes showed stale auth state due to race conditions with cookie setting/deletion. This is a real-world problem in modern SPAs with secure auth.

**Solution:**

- Added retry logic and short delays on `/auth/callback` to ensure cookies were available before checking auth.
- Forced full page reload and state clear on logout.
- Ensured backend `set_cookie` and `delete_cookie` used identical domain/path.

---

## 10. Challenge: Compliance, Legal, and Data Retention

**Technical Detail & Rationale:**  
Needed to support GDPR, soft deletion, and legal compliance for SaaS. This is a must-have for any real product, not just a demo.

**Solution:**

- Implemented soft deletion with 30-day retention.
- Wrote and linked Terms, Privacy, and Cookie Policy.
- Used `ON DELETE SET NULL` for foreign keys to allow safe user/org deletion.

---

## 11. Challenge: Learning Curve—Cloud, CI/CD, and Full SaaS Delivery

**Technical Detail & Rationale:**  
This was my first time doing full AWS cloud infra, CI/CD, and production SaaS deployment end-to-end. I had to combine knowledge from 7 internships and self-teach AWS, Docker, and GitHub Actions to deliver a real, production-grade SaaS.

**Solution:**

- Self-taught AWS (ECS, ALB, S3, CloudFront, Route 53, ACM, Lambda), Docker, and GitHub Actions.
- Documented every step for future contributors.

---

## 12. Challenge: Product Thinking & Roadmap

**Technical Detail & Rationale:**  
Balancing MVP delivery with long-term extensibility and community growth is a real engineering challenge. It’s easy to ship a demo; it’s hard to build for scale and future features.

**Solution:**

- Designed modular API and data models for easy addition of new features (delivery channels, metrics, plugins).
- Added a clear roadmap and GitHub Issues for next-phase enhancements (observability, automation, advanced RBAC, etc.).
- Wrote onboarding and contribution docs.

---

## Tech Stack Rationale

- **AWS (ECS Fargate, S3, CloudFront, ALB, Route 53, ACM, Lambda):**
  - Industry standard for cloud SaaS, deep integration, and real-world relevance.
  - ECS Fargate: managed, scalable container orchestration (no EC2 node management).
  - S3 + CloudFront: best for static asset hosting and global CDN.
  - ALB: blue/green deploys, fine-grained routing, static IP.
  - Route 53 & ACM: custom domains, SSL, DNS.
  - Lambda: serverless scheduled jobs.
  - Chosen for both learning and production value.
- **FastAPI (Python 3.11+):**
  - Async support, type safety, automatic OpenAPI docs.
  - More scalable/maintainable than Flask for real APIs.
- **React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui:**
  - React: industry SPA standard, huge ecosystem.
  - TypeScript: type safety, maintainability.
  - Vite: fast local dev/builds.
  - Tailwind/shadcn: rapid, accessible, beautiful UI.
- **Supabase (Postgres):**
  - Managed Postgres, modern API, real-time features.
  - Open-source ethos, Postgres is analytics gold standard.
- **GitHub OAuth, JWT, Secure HTTP-only Cookies:**
  - GitHub OAuth: familiar, easy for devs.
  - JWT: stateless, secure auth.
  - Secure cookies: browser security, session management.
- **Stripe Billing & Webhooks:**
  - Industry leader for SaaS billing, compliance, and webhooks.
- **Prometheus, Health Endpoints, CloudWatch:**
  - Prometheus: open-source metrics/alerting standard.
  - Health endpoints: required for cloud-native deploys.
  - CloudWatch: AWS-native logging/monitoring.
- **Docker, GitHub Actions, AWS SSM Parameter Store:**
  - Docker: reproducible builds, local/prod parity.
  - GitHub Actions: modern, flexible CI/CD.
  - SSM: secure, cloud-native secret management.
- **Cursor, lovable-tagger, Prettier, Ruff, Black:**
  - AI-powered tools for rapid prototyping, code review, best-practice enforcement.
  - Prettier, Ruff, Black: code quality and consistency.
- **GDPR, MIT License, Terms/Privacy/Cookie Policy:**
  - Legal/compliance are non-negotiable for SaaS.
  - MIT: maximizes adoption. GDPR/policies build trust.
