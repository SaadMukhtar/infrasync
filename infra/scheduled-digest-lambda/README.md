# Infrasync - Scheduled Digest Lambda

This AWS Lambda runs on a schedule (daily or weekly) to trigger GPT-powered GitHub digests via the `/digest` endpoint in the Infrasync backend.

## 📦 What It Does

- Fetches all active monitors from Supabase
- Sends each config to the backend `/digest` endpoint
- Supports daily/weekly delivery via Slack, Discord, or Email

## ⚙️ Setup

1. Add your environment variables:

   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `BACKEND_DIGEST_ENDPOINT`

2. Build the Docker image:
   ```bash
   docker build -t infrasync-digest-lambda .
   ```
3. Push to ECR:

```bash
Copy
Edit
docker tag infrasync-digest-lambda:latest <your-ecr-uri>:latest
docker push <your-ecr-uri>:latest
```

4a. Deploy the Lambda:

```bash
aws lambda create-function ...
```

4b. Deploy Script:

Use `deploy.sh` to build, push, and update the Lambda with one command.

```bash
chmod +x deploy.sh
./deploy.sh
```

5. Schedule it using EventBridge (CloudWatch Events) with cron expressions:

- Daily: cron(0 13 \* _ ? _)
- Weekly: cron(0 13 ? _ MON _)

📁 Files

- `lambda_function.py` — The async handler logic
- `Dockerfile` — Lambda container definition
- `requirements.txt` — Dependencies (httpx)

## 📌 Notes

- Built using AWS Lambda Python Base Image (public.ecr.aws/lambda/python)
- Deployed as a container image via ECR
- Easily extendable to filter by frequency or org-level customization

```

```
