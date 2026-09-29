# PAMS API

Express/TypeScript API for the Passport Application Management System. PostgreSQL is accessed through Prisma; Redis backs distributed rate limiting when `REDIS_URL` is set. Uploaded documents are stored as authenticated Cloudinary assets.

## Local Setup

1. Copy `.env.example` to `.env` and set independent JWT secrets. Add Cloudinary and Resend credentials for document uploads and password-reset delivery.
2. Start PostgreSQL and Redis with `docker compose up -d postgres redis`, or start the full stack with `docker compose up --build`.
3. Run `npm run db:generate`, then `npm run db:migrate`.
4. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD`, then run `npm run db:seed` once to create the first administrator.
5. Start the API with `npm run dev:api`. It listens on port 4000; the existing Vite frontend remains on port 5173.

`npm run build:api` generates Prisma Client and compiles the API. `npm run typecheck:api` checks it without emitting output. `npm run db:migrate:dev` is for local schema development; production deployments should use `npm run db:migrate`.
After deployment, `npm run db:verify` checks that the expected tables, migration, triggers, stored routines, and required PostgreSQL extension are present.

For a free-tier hosted deployment, follow [the deployment guide](docs/free-deployment.md). Render and Vercel manifests are provided at the repository root.

## Endpoints

All routes are under `/api/v1`; JSON errors use `{ "error": "..." }`.

| Area | Routes |
| --- | --- |
| Auth | `POST /auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`; `GET /auth/me` |
| Applicants | CRUD `/applicants`; listing and creation are officer/admin only, deletion deactivates the account |
| Applications | CRUD `/applications`; `PATCH /applications/:id/status` enforces lifecycle transitions |
| Documents | `POST /documents` multipart field `file`; list at `/documents/application/:applicationId`; review and signed download at `/documents/:id/review` and `/documents/:id/download` |
| Appointments | `GET/POST /appointments`, `PATCH/DELETE /appointments/:id`; 30-minute center conflicts are rejected by service and database constraint |
| Payments | `GET/POST /payments`; paid receipts are PDFs at `/payments/:id/receipt` |
| Verifications | `GET /verifications`; `POST /verifications/application/:applicationId` for officer decisions |
| Passports | `GET/POST /passports`; `PATCH /passports/:id/status` |
| Operations | `GET /health`; signed payment callback at `POST /webhooks/payment` |

Applicant registration always creates an `APPLICANT`; public registration cannot assign privileged roles. `OFFICER` and `ADMIN` are provisioned administratively. The first administrator is created by the one-time seed command.

## Integrations

- Password reset uses Resend when `RESEND_API_KEY`, `MAIL_FROM`, and `PASSWORD_RESET_URL` are configured. In development, the generated token is logged for local testing. Production startup requires these settings.
- Document uploads accept PDF, JPEG, and PNG up to 10 MiB; both MIME type and file signature are checked. Cloudinary assets use authenticated delivery and downloads are signed for five minutes.
- Payment creation uses server-owned fee rules (INR 1,500 for fresh applications and INR 1,000 for reissues) and remains `PENDING` until a provider callback confirms it. Configure `PAYMENT_WEBHOOK_SECRET`; callbacks send the exact raw JSON bytes with `x-pams-signature: <lowercase-hex HMAC-SHA256>`. Payload fields: `paymentId`, `providerRef`, `status` (`PAID` or `FAILED`), `amount`, and `currency` (`INR`). A gateway checkout adapter is intentionally provider-specific and must be connected before accepting real money.
- Production requires PostgreSQL, Redis, Cloudinary, Resend, strong separate JWT secrets, and a payment webhook secret. Keep secrets in a managed secret store; do not commit `.env`.

## Database

The Prisma model is in `prisma/schema.prisma`; the initial PostgreSQL migration includes indexes, foreign keys, checks, appointment exclusion constraints, application/passport status triggers, and procedures/functions for status transitions and passport issue. See [the ER diagram](docs/er-diagram.md).
