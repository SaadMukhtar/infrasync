# 🛠️ Infrasync Infrastructure Guide

This folder contains all deployment-related scripts and resources for setting up and maintaining the Infrasync backend services, automation, and cloud infrastructure.

Built with production readiness, open-source extensibility, and DevOps best practices in mind.

---

## 📦 Structure Overview

```bash
infra/
├── deploy-backend.sh                # Deploys the FastAPI backend to ECS
├── scheduled-digest-lambda/
│   ├── deploy.sh                    # Deploys the scheduled digest Lambda
│   ├── lambda_function.py          # Source code for Lambda
│   ├── Dockerfile                  # Container definition
│   ├── requirements.txt            # Lambda dependencies
│   └── README.md                   # Lambda-specific setup docs
└── README.md                       # You're here
```

---

## 🚀 Deployment Scripts

These scripts are designed for local or CI-based deployments.
Make sure to populate a local `.env` file or set environment variables beforehand.

### ✅ `deploy-backend.sh`

Deploys the FastAPI backend service to AWS ECS (Fargate).

Required Environment Variables:

```env
BACKEND_ECR_URI=your_ecr_uri_for_backend
BACKEND_SERVICE_NAME=infrasync-backend
BACKEND_CLUSTER_NAME=infrasync-cluster
```

### ✅ `scheduled-digest-lambda/deploy.sh`

Deploys the Dockerized Lambda for scheduled GitHub digests.

Required Environment Variables:

```env
LAMBDA_ECR_URI=your_ecr_uri_for_lambda
LAMBDA_NAME=infrasync-scheduled-digest
```

---

## 🧠 Best Practices

- All deploys use `docker buildx --platform linux/amd64` for AWS compatibility
- Scripts follow the 12-factor app principle: no secrets in code, all config via env vars
- Secrets and credentials are never committed — use `.env.example` for templates
- Scripts are designed to fail fast on misconfiguration or failed steps

---

## 🌱 Coming Soon

- GitHub Actions workflows for CI/CD
- Terraform or CDK modules for infra-as-code
- Custom domain + HTTPS setup (e.g. `api.infrasync.dev`)
- Secrets Manager integration for production deployments

---

## 🧩 Notes for Contributors

- Never commit your `.env` file or AWS credentials
- Always test deploy scripts locally before pushing major changes
- PRs that improve infra automation are welcome and encouraged

---

> Ready to deploy? Head into the respective script folder, populate your `.env`, and run:
>
> ```bash
> ./deploy-backend.sh
> ```
>
> or
>
> ```bash
> ./scheduled-digest-lambda/deploy.sh
> ```
