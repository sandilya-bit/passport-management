-- CreateEnum
CREATE TYPE "Role" AS ENUM ('APPLICANT', 'OFFICER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('FRESH', 'REISSUE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_REQUIRED', 'APPOINTMENT_BOOKED', 'VERIFIED', 'APPROVED', 'REJECTED', 'PASSPORT_ISSUED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('IDENTITY', 'ADDRESS', 'DATE_OF_BIRTH', 'PHOTOGRAPH', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('BOOKED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PassportStatus" AS ENUM ('GENERATED', 'ISSUED', 'REVOKED');

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(30) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'APPLICANT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicants" (
    "id" VARCHAR(30) NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "address" VARCHAR(500) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "postalCode" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "applicants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" VARCHAR(30) NOT NULL,
    "applicationNumber" VARCHAR(32) NOT NULL,
    "applicantId" VARCHAR(30) NOT NULL,
    "type" "ApplicationType" NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" VARCHAR(2000),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" VARCHAR(30) NOT NULL,
    "applicationId" VARCHAR(30) NOT NULL,
    "uploadedById" VARCHAR(30) NOT NULL,
    "reviewedById" VARCHAR(30),
    "kind" "DocumentKind" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "originalName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" CHAR(64) NOT NULL,
    "cloudinaryPublicId" VARCHAR(255) NOT NULL,
    "secureUrl" VARCHAR(2048) NOT NULL,
    "reviewRemarks" VARCHAR(1000),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" VARCHAR(30) NOT NULL,
    "applicationId" VARCHAR(30) NOT NULL,
    "bookedById" VARCHAR(30) NOT NULL,
    "center" VARCHAR(200) NOT NULL,
    "startsAt" TIMESTAMPTZ(6) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'BOOKED',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" VARCHAR(30) NOT NULL,
    "applicationId" VARCHAR(30) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "providerRef" VARCHAR(255),
    "receiptNumber" VARCHAR(32) NOT NULL,
    "paidAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" VARCHAR(30) NOT NULL,
    "applicationId" VARCHAR(30) NOT NULL,
    "reviewerId" VARCHAR(30) NOT NULL,
    "status" "VerificationStatus" NOT NULL,
    "remarks" VARCHAR(2000) NOT NULL,
    "reviewedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passports" (
    "id" VARCHAR(30) NOT NULL,
    "applicationId" VARCHAR(30) NOT NULL,
    "passportNumber" VARCHAR(20) NOT NULL,
    "status" "PassportStatus" NOT NULL DEFAULT 'GENERATED',
    "issuedAt" TIMESTAMPTZ(6),
    "expiresAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "passports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" VARCHAR(30) NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "revokedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" VARCHAR(30) NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "usedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_isActive_idx" ON "users"("role", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "applicants_userId_key" ON "applicants"("userId");

-- CreateIndex
CREATE INDEX "applicants_lastName_firstName_idx" ON "applicants"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "applicants_phone_idx" ON "applicants"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "applications_applicationNumber_key" ON "applications"("applicationNumber");

-- CreateIndex
CREATE INDEX "applications_applicantId_createdAt_idx" ON "applications"("applicantId", "createdAt");

-- CreateIndex
CREATE INDEX "applications_status_createdAt_idx" ON "applications"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "documents_cloudinaryPublicId_key" ON "documents"("cloudinaryPublicId");

-- CreateIndex
CREATE INDEX "documents_applicationId_status_idx" ON "documents"("applicationId", "status");

-- CreateIndex
CREATE INDEX "documents_uploadedById_createdAt_idx" ON "documents"("uploadedById", "createdAt");

-- CreateIndex
CREATE INDEX "appointments_applicationId_startsAt_idx" ON "appointments"("applicationId", "startsAt");

-- CreateIndex
CREATE INDEX "appointments_center_startsAt_status_idx" ON "appointments"("center", "startsAt", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_providerRef_key" ON "payments"("providerRef");

-- CreateIndex
CREATE UNIQUE INDEX "payments_receiptNumber_key" ON "payments"("receiptNumber");

-- CreateIndex
CREATE INDEX "payments_applicationId_createdAt_idx" ON "payments"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "payments_status_createdAt_idx" ON "payments"("status", "createdAt");

-- CreateIndex
CREATE INDEX "verifications_applicationId_reviewedAt_idx" ON "verifications"("applicationId", "reviewedAt");

-- CreateIndex
CREATE INDEX "verifications_reviewerId_reviewedAt_idx" ON "verifications"("reviewerId", "reviewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "passports_applicationId_key" ON "passports"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "passports_passportNumber_key" ON "passports"("passportNumber");

-- CreateIndex
CREATE INDEX "passports_status_issuedAt_idx" ON "passports"("status", "issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_revokedAt_expiresAt_idx" ON "refresh_tokens"("userId", "revokedAt", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_tokenHash_key" ON "password_resets"("tokenHash");

-- CreateIndex
CREATE INDEX "password_resets_userId_usedAt_expiresAt_idx" ON "password_resets"("userId", "usedAt", "expiresAt");

-- AddForeignKey
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "applicants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_bookedById_fkey" FOREIGN KEY ("bookedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passports" ADD CONSTRAINT "passports_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "documents"
    ADD CONSTRAINT "documents_sizeBytes_check" CHECK ("sizeBytes" BETWEEN 1 AND 10485760);

ALTER TABLE "payments"
    ADD CONSTRAINT "payments_amount_positive_check" CHECK ("amount" > 0),
    ADD CONSTRAINT "payments_paid_at_check" CHECK ("status" <> 'PAID' OR "paidAt" IS NOT NULL);

ALTER TABLE "passports"
    ADD CONSTRAINT "passports_issue_dates_check" CHECK (
        ("status" <> 'ISSUED' OR ("issuedAt" IS NOT NULL AND "expiresAt" IS NOT NULL AND "expiresAt" > "issuedAt"))
    );

CREATE UNIQUE INDEX "appointments_one_active_per_application_idx"
    ON "appointments"("applicationId")
    WHERE "status" IN ('BOOKED', 'RESCHEDULED');

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "appointments"
    ADD CONSTRAINT "appointments_no_overlapping_slots"
    EXCLUDE USING gist (
        "center" WITH =,
        tstzrange("startsAt", "startsAt" + INTERVAL '30 minutes', '[)') WITH &&
    ) WHERE ("status" IN ('BOOKED', 'RESCHEDULED'));

CREATE OR REPLACE FUNCTION enforce_application_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD."status" = NEW."status" THEN
        RETURN NEW;
    END IF;

    IF NOT (
        (OLD."status" = 'DRAFT' AND NEW."status" IN ('SUBMITTED', 'CANCELLED')) OR
        (OLD."status" = 'SUBMITTED' AND NEW."status" IN ('UNDER_REVIEW', 'APPOINTMENT_BOOKED', 'CANCELLED')) OR
        (OLD."status" = 'UNDER_REVIEW' AND NEW."status" IN ('DOCUMENTS_REQUIRED', 'VERIFIED', 'REJECTED')) OR
        (OLD."status" = 'DOCUMENTS_REQUIRED' AND NEW."status" IN ('SUBMITTED', 'CANCELLED')) OR
        (OLD."status" = 'APPOINTMENT_BOOKED' AND NEW."status" IN ('SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_REQUIRED', 'VERIFIED', 'REJECTED')) OR
        (OLD."status" = 'VERIFIED' AND NEW."status" IN ('APPROVED', 'REJECTED')) OR
        (OLD."status" = 'APPROVED' AND NEW."status" = 'PASSPORT_ISSUED')
    ) THEN
        RAISE EXCEPTION 'Invalid application status transition: % -> %', OLD."status", NEW."status"
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "applications_status_transition_trigger"
BEFORE UPDATE OF "status" ON "applications"
FOR EACH ROW EXECUTE FUNCTION enforce_application_status_transition();

CREATE OR REPLACE FUNCTION sync_application_status_from_appointment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."status" IN ('BOOKED', 'RESCHEDULED') THEN
        UPDATE "applications"
        SET "status" = 'APPOINTMENT_BOOKED', "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = NEW."applicationId" AND "status" = 'SUBMITTED';
    ELSIF NEW."status" = 'CANCELLED' THEN
        UPDATE "applications"
        SET "status" = 'SUBMITTED', "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = NEW."applicationId" AND "status" = 'APPOINTMENT_BOOKED'
            AND NOT EXISTS (
                SELECT 1 FROM "appointments"
                WHERE "applicationId" = NEW."applicationId" AND "id" <> NEW."id"
                    AND "status" IN ('BOOKED', 'RESCHEDULED')
            );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "appointments_sync_application_status_trigger"
AFTER INSERT OR UPDATE OF "status" ON "appointments"
FOR EACH ROW EXECUTE FUNCTION sync_application_status_from_appointment();

CREATE OR REPLACE FUNCTION sync_application_status_from_passport()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."status" = 'ISSUED' AND OLD."status" <> 'ISSUED' THEN
        UPDATE "applications"
        SET "status" = 'PASSPORT_ISSUED', "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = NEW."applicationId" AND "status" = 'APPROVED';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "passports_sync_application_status_trigger"
AFTER UPDATE OF "status" ON "passports"
FOR EACH ROW EXECUTE FUNCTION sync_application_status_from_passport();

CREATE OR REPLACE FUNCTION transition_application_status(
    p_application_id VARCHAR(30),
    p_target_status "ApplicationStatus"
)
RETURNS "ApplicationStatus" AS $$
DECLARE
    v_status "ApplicationStatus";
BEGIN
    UPDATE "applications" SET "status" = p_target_status, "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = p_application_id
    RETURNING "status" INTO v_status;
    IF NOT FOUND THEN RAISE EXCEPTION 'Application not found'; END IF;
    RETURN v_status;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE PROCEDURE issue_passport(
    p_application_id VARCHAR(30),
    p_passport_number VARCHAR(20)
)
LANGUAGE plpgsql AS $$
DECLARE
    v_passport_id VARCHAR(30);
    v_application_status "ApplicationStatus";
BEGIN
    SELECT "status" INTO v_application_status
    FROM "applications" WHERE "id" = p_application_id FOR UPDATE;
    IF NOT FOUND OR v_application_status <> 'APPROVED' THEN
        RAISE EXCEPTION 'Application must be approved before passport issue';
    END IF;

    UPDATE "passports"
    SET "status" = 'ISSUED', "issuedAt" = CURRENT_TIMESTAMP,
            "expiresAt" = CURRENT_TIMESTAMP + INTERVAL '10 years', "updatedAt" = CURRENT_TIMESTAMP
    WHERE "applicationId" = p_application_id AND "passportNumber" = p_passport_number
        AND "status" = 'GENERATED'
    RETURNING "id" INTO v_passport_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Generated passport record not found'; END IF;

    UPDATE "applications" SET "status" = 'PASSPORT_ISSUED', "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = p_application_id;
END;
$$;

CREATE OR REPLACE PROCEDURE confirm_payment(
    p_payment_id VARCHAR(30),
    p_provider_ref VARCHAR(255),
    p_amount DECIMAL(10, 2),
    p_currency CHAR(3)
)
LANGUAGE plpgsql AS $$
DECLARE
    v_payment "payments"%ROWTYPE;
BEGIN
    SELECT * INTO v_payment FROM "payments" WHERE "id" = p_payment_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
    IF v_payment."status" = 'PAID' AND v_payment."providerRef" = p_provider_ref THEN RETURN; END IF;
    IF v_payment."status" <> 'PENDING' THEN RAISE EXCEPTION 'Payment is already in a final state'; END IF;
    IF v_payment."amount" <> p_amount OR v_payment."currency" <> p_currency THEN
        RAISE EXCEPTION 'Payment amount or currency does not match';
    END IF;

    UPDATE "payments"
    SET "status" = 'PAID', "providerRef" = p_provider_ref, "paidAt" = CURRENT_TIMESTAMP
    WHERE "id" = p_payment_id;
END;
$$;

