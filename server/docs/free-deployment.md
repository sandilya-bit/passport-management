# Free-Tier Deployment

This repository is prepared for a Vercel-hosted Vite frontend and a Render-hosted Express API. Free plans have quotas, cold starts, and provider-specific restrictions; the backend/database providers may change their free tiers over time.

## 1. Provision Services

Create these resources using their current free plans:

- A PostgreSQL database (for example, Neon). Copy its pooled or direct connection URI as required by that provider, with TLS enabled.
- A Redis database (for example, Upstash Redis). Copy the `rediss://` or supported Redis connection URL.
- A Cloudinary account for private document storage.
- A Resend account and verified sender domain/address for password reset.
- A Render web service from this repository. The included `render.yaml` describes its build, migration, start, and health-check commands.
- A Vercel project from this repository. The included `vercel.json` builds the Vite site from the repository root and supports client-side routes.

## 2. Configure the API on Render

Connect the repo to Render and create the Blueprint service from `render.yaml`. Enter the following values in the `pams-api` service environment:

- `DATABASE_URL`: PostgreSQL connection URI. Keep credentials private.
- `REDIS_URL`: Redis connection URI.
- `CORS_ORIGIN`: the exact deployed Vercel origin, such as `https://your-project.vercel.app`; do not add a path or trailing slash.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- `RESEND_API_KEY`, `MAIL_FROM`, `PASSWORD_RESET_URL`. Set the reset URL to `https://your-project.vercel.app/reset-password`.

Render generates the JWT and payment-webhook secrets through the Blueprint. The service runs `npm ci && npm run build:api`, then `npm run db:migrate && npm run start:api`; `/health` is its health check. The first deployment applies the initial PostgreSQL migration.

## 3. Configure the Frontend on Vercel

Set the Vercel project root to the repository root. Set this build-time environment variable for Production (and Preview if used):

```text
VITE_API_BASE_URL=https://your-api-service.onrender.com/api/v1
```

Use the actual Render hostname. Redeploy after changing environment variables; Vite embeds these values at build time. Do not place secrets in any `VITE_*` variable.

## 4. Bootstrap Access

After the API and database are healthy, create the first admin from a trusted local terminal using the production database connection and a strong one-time password:

```powershell
$env:DATABASE_URL = "<production database URL>"
$env:ADMIN_EMAIL = "admin@your-domain.example"
$env:ADMIN_PASSWORD = "<strong password of at least 12 characters>"
npm run db:seed
```

Do not run the seed command on every deploy. Provision officer accounts through a controlled administrative process; public registration cannot choose privileged roles.

## 5. Verify

- Open `https://your-api-service.onrender.com/health`; expect `status: ok`, `database: ok`, and `redis: ok`.
- From a trusted terminal with the production `DATABASE_URL`, run `npm run db:verify`; it checks all ten tables, the status triggers and stored routines, `btree_gist`, and the applied initial migration.
- Open the Vercel site, register an applicant, and confirm browser requests target the Render API.
- Test password reset and document upload only after Resend and Cloudinary are configured.
- Keep real payment processing disabled until a payment-provider checkout adapter and signed callback are configured. The API webhook is not itself a payment gateway.

Free web services can sleep when idle and may have limited database storage, bandwidth, and uptime. This setup is suitable for demos and coursework, not sensitive production passport data without a security, privacy, availability, and compliance review.
