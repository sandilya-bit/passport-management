# API Contract Notes

## Authentication

Access tokens are JWTs with a 15-minute default lifetime. Refresh tokens are JWTs whose SHA-256 digests are persisted, rotated on refresh, and revoked on logout or password reset. Send the access token as `Authorization: Bearer <token>`. Passwords must be at least 12 characters.

## Workflow

Application status changes are transition-checked in service code and again by a PostgreSQL trigger. Applicants can submit or cancel their own draft/submitted requests; officers review submitted requests and record remarks. Admin/officer routes are protected by role middleware. Applicant queries are scoped to the authenticated user.

## Payment callback signing

Sign the exact request bytes, without parsing or reserializing JSON:

```text
hex(HMAC-SHA256(PAYMENT_WEBHOOK_SECRET, raw_request_body))
```

Send that value in `x-pams-signature`. The callback is idempotent for the same final status and provider reference, checks the stored amount/currency, and refuses conflicting final-state updates.
# API Contract Notes

## Authentication

Access tokens are JWTs with a 15-minute default lifetime. Refresh tokens are JWTs whose SHA-256 digests are persisted, rotated on refresh, and revoked on logout or password reset. Send the access token as `Authorization: Bearer <token>`. Passwords must be at least 12 characters.

## Workflow

Application status changes are transition-checked in service code and again by a PostgreSQL trigger. Applicants can submit or cancel their own draft/submitted requests; officers review submitted requests and record remarks. Admin/officer routes are protected by role middleware. Applicant queries are scoped to the authenticated user.

## Payment callback signing

Sign the exact request bytes, without parsing or reserializing JSON:

```text
hex(HMAC-SHA256(PAYMENT_WEBHOOK_SECRET, raw_request_body))
```

Send that value in `x-pams-signature`. The callback is idempotent for the same final status and provider reference, checks the stored amount/currency, and refuses conflicting final-state updates.
