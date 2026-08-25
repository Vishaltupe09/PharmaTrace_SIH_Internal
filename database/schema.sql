-- ==============================================================================
-- PharmaTrace Database Schema (PostgreSQL DDL)
-- Spec Reference: PharmaTrace_PRD.md §21
-- ==============================================================================

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. ENUM TYPES
-- ------------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM (
        'ADMIN',
        'MANUFACTURER',
        'DISTRIBUTOR',
        'WHOLESALER',
        'PHARMACY',
        'INSPECTOR'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "UserStatus" AS ENUM (
        'PENDING',
        'APPROVED',
        'REJECTED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "BatchStatus" AS ENUM (
        'CREATED',
        'IN_TRANSIT',
        'RECEIVED',
        'FLAGGED',
        'RECALLED',
        'DISPENSED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ChainStatus" AS ENUM (
        'PENDING',
        'CONFIRMED',
        'FAILED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 2. USERS & ENTITY PROFILES
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "wallet_address" VARCHAR(66),
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "manufacturers" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
    "org_name" VARCHAR(255) NOT NULL,
    "license_no" VARCHAR(100) NOT NULL UNIQUE,
    "wallet_address" VARCHAR(66) UNIQUE,
    "approved_at" TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS "distributors" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
    "org_name" VARCHAR(255) NOT NULL,
    "license_no" VARCHAR(100) NOT NULL UNIQUE,
    "wallet_address" VARCHAR(66) UNIQUE,
    "approved_at" TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS "wholesalers" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
    "org_name" VARCHAR(255) NOT NULL,
    "license_no" VARCHAR(100) NOT NULL UNIQUE,
    "wallet_address" VARCHAR(66) UNIQUE,
    "approved_at" TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS "pharmacies" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
    "org_name" VARCHAR(255) NOT NULL,
    "license_no" VARCHAR(100) NOT NULL UNIQUE,
    "wallet_address" VARCHAR(66) UNIQUE,
    "approved_at" TIMESTAMP WITH TIME ZONE
);

-- ------------------------------------------------------------------------------
-- 3. MEDICINES, BATCHES & PACKAGES
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "medicines" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "generic_name" VARCHAR(255) NOT NULL,
    "brand_name" VARCHAR(255) NOT NULL,
    "dosage_form" VARCHAR(100) NOT NULL,
    "strength" VARCHAR(100) NOT NULL,
    "storage_requirements" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "batches" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "medicine_id" UUID NOT NULL REFERENCES "medicines"("id") ON DELETE RESTRICT,
    "manufacturer_id" UUID NOT NULL REFERENCES "manufacturers"("id") ON DELETE RESTRICT,
    "batch_number" VARCHAR(100) NOT NULL UNIQUE,
    "mfg_date" TIMESTAMP WITH TIME ZONE NOT NULL,
    "expiry_date" TIMESTAMP WITH TIME ZONE NOT NULL,
    "quantity" INTEGER NOT NULL CHECK (quantity > 0),
    "status" "BatchStatus" NOT NULL DEFAULT 'CREATED',
    "metadata_hash" VARCHAR(66) NOT NULL,
    "chain_batch_id" VARCHAR(100) NOT NULL,
    "tx_hash" VARCHAR(66),
    "chain_status" "ChainStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "packages" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "batch_id" UUID NOT NULL REFERENCES "batches"("id") ON DELETE CASCADE,
    "package_qr_id" VARCHAR(100) NOT NULL UNIQUE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 4. CUSTODY, SHIPMENTS & QR CODES
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "shipments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "batch_id" UUID NOT NULL REFERENCES "batches"("id") ON DELETE CASCADE,
    "from_entity_id" UUID NOT NULL,
    "to_entity_id" UUID NOT NULL,
    "initiated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "received_at" TIMESTAMP WITH TIME ZONE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'IN_TRANSIT'
);

CREATE TABLE IF NOT EXISTS "custody_transfers" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "batch_id" UUID NOT NULL REFERENCES "batches"("id") ON DELETE CASCADE,
    "from_address" VARCHAR(66) NOT NULL,
    "to_address" VARCHAR(66) NOT NULL,
    "tx_hash" VARCHAR(66) NOT NULL,
    "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "qr_codes" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "batch_id" UUID NOT NULL REFERENCES "batches"("id") ON DELETE CASCADE,
    "package_id" UUID REFERENCES "packages"("id") ON DELETE CASCADE,
    "payload" TEXT NOT NULL,
    "signature" VARCHAR(255) NOT NULL,
    "issued_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 5. VERIFICATIONS, RECALLS & RISK SCORING
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "verification_records" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "qr_id" VARCHAR(100) NOT NULL,
    "scanned_by_user_id" UUID,
    "result_state" VARCHAR(100) NOT NULL,
    "geo_lat" DOUBLE PRECISION,
    "geo_lng" DOUBLE PRECISION,
    "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "recalls" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "batch_id" UUID NOT NULL REFERENCES "batches"("id") ON DELETE CASCADE,
    "reason" TEXT NOT NULL,
    "initiated_by" VARCHAR(255) NOT NULL,
    "tx_hash" VARCHAR(66),
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "risk_scores" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "batch_id" UUID NOT NULL REFERENCES "batches"("id") ON DELETE CASCADE,
    "score" INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    "factors" JSONB NOT NULL,
    "computed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 6. SECURITY EVENTS & AUDIT LOGS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "security_events" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "type" VARCHAR(100) NOT NULL,
    "severity" VARCHAR(50) NOT NULL,
    "related_entity" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "actor_user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" VARCHAR(255) NOT NULL,
    "tx_hash" VARCHAR(66),
    "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 7. PERFORMANCE & LOOKUP INDEXES
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role");
CREATE INDEX IF NOT EXISTS "idx_batches_batch_number" ON "batches"("batch_number");
CREATE INDEX IF NOT EXISTS "idx_batches_medicine_id" ON "batches"("medicine_id");
CREATE INDEX IF NOT EXISTS "idx_batches_manufacturer_id" ON "batches"("manufacturer_id");
CREATE INDEX IF NOT EXISTS "idx_packages_batch_id" ON "packages"("batch_id");
CREATE INDEX IF NOT EXISTS "idx_packages_qr_id" ON "packages"("package_qr_id");
CREATE INDEX IF NOT EXISTS "idx_shipments_batch_id" ON "shipments"("batch_id");
CREATE INDEX IF NOT EXISTS "idx_custody_transfers_batch_id" ON "custody_transfers"("batch_id");
CREATE INDEX IF NOT EXISTS "idx_qr_codes_batch_id" ON "qr_codes"("batch_id");
CREATE INDEX IF NOT EXISTS "idx_verification_records_qr_id" ON "verification_records"("qr_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_actor" ON "audit_logs"("actor_user_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_timestamp" ON "audit_logs"("timestamp" DESC);
CREATE INDEX IF NOT EXISTS "idx_security_events_created_at" ON "security_events"("created_at" DESC);
