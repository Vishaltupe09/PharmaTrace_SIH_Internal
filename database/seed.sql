-- ==============================================================================
-- PharmaTrace Database Demo Seed Data (PostgreSQL SQL)
-- Demo Accounts & Medicine Formulations
-- ==============================================================================

-- 1. Demo Admin (Password: AdminPassword123!)
-- Hash generated with bcrypt $2a$10$...
INSERT INTO "users" ("id", "email", "password_hash", "role", "status", "wallet_address")
VALUES (
    '10000000-0000-0000-0000-000000000001',
    'admin@pharmatrace.com',
    '$2a$10$tZ2E2c6oGfGf7qW073i6q.u318B0QWp4n4PZzF7Pq418qPj/eR8hO',
    'ADMIN',
    'APPROVED',
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
) ON CONFLICT ("email") DO NOTHING;

-- 2. Demo Manufacturer (Password: Manufacturer123!)
INSERT INTO "users" ("id", "email", "password_hash", "role", "status", "wallet_address")
VALUES (
    '10000000-0000-0000-0000-000000000002',
    'manufacturer@pharmatrace.com',
    '$2a$10$lE.kI7sWf7W3d6M9wA2F..f5zX/bT1Z9uY3hL8gE1rU0lPqO9eZ6O',
    'MANUFACTURER',
    'APPROVED',
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
) ON CONFLICT ("email") DO NOTHING;

INSERT INTO "manufacturers" ("id", "user_id", "org_name", "license_no", "wallet_address", "approved_at")
VALUES (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'ThalassemiCure Pharma Ltd.',
    'MFR-DEMO-001',
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    CURRENT_TIMESTAMP
) ON CONFLICT ("license_no") DO NOTHING;

-- 3. Demo Distributor (Password: Distributor123!)
INSERT INTO "users" ("id", "email", "password_hash", "role", "status", "wallet_address")
VALUES (
    '10000000-0000-0000-0000-000000000003',
    'distributor@pharmatrace.com',
    '$2a$10$lE.kI7sWf7W3d6M9wA2F..f5zX/bT1Z9uY3hL8gE1rU0lPqO9eZ6O',
    'DISTRIBUTOR',
    'APPROVED',
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
) ON CONFLICT ("email") DO NOTHING;

INSERT INTO "distributors" ("id", "user_id", "org_name", "license_no", "wallet_address", "approved_at")
VALUES (
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000003',
    'MedSupply Distributors Pvt. Ltd.',
    'DIST-DEMO-001',
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    CURRENT_TIMESTAMP
) ON CONFLICT ("license_no") DO NOTHING;

-- 4. Demo Wholesaler (Password: Wholesaler123!)
INSERT INTO "users" ("id", "email", "password_hash", "role", "status", "wallet_address")
VALUES (
    '10000000-0000-0000-0000-000000000004',
    'wholesaler@pharmatrace.com',
    '$2a$10$lE.kI7sWf7W3d6M9wA2F..f5zX/bT1Z9uY3hL8gE1rU0lPqO9eZ6O',
    'WHOLESALER',
    'APPROVED',
    '0x90F79bf6EB2c4f870365E785982E1f101E93b906'
) ON CONFLICT ("email") DO NOTHING;

INSERT INTO "wholesalers" ("id", "user_id", "org_name", "license_no", "wallet_address", "approved_at")
VALUES (
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000004',
    'PharmaWholesale India Ltd.',
    'WS-DEMO-001',
    '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    CURRENT_TIMESTAMP
) ON CONFLICT ("license_no") DO NOTHING;

-- 5. Demo Pharmacy (Password: Pharmacy123!)
INSERT INTO "users" ("id", "email", "password_hash", "role", "status", "wallet_address")
VALUES (
    '10000000-0000-0000-0000-000000000005',
    'pharmacy@pharmatrace.com',
    '$2a$10$lE.kI7sWf7W3d6M9wA2F..f5zX/bT1Z9uY3hL8gE1rU0lPqO9eZ6O',
    'PHARMACY',
    'APPROVED',
    '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65'
) ON CONFLICT ("email") DO NOTHING;

INSERT INTO "pharmacies" ("id", "user_id", "org_name", "license_no", "wallet_address", "approved_at")
VALUES (
    '20000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000005',
    'City Care Pharmacy',
    'PH-DEMO-001',
    '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    CURRENT_TIMESTAMP
) ON CONFLICT ("license_no") DO NOTHING;

-- 6. Demo Inspector (Password: Inspector123!)
INSERT INTO "users" ("id", "email", "password_hash", "role", "status")
VALUES (
    '10000000-0000-0000-0000-000000000006',
    'inspector@pharmatrace.com',
    '$2a$10$lE.kI7sWf7W3d6M9wA2F..f5zX/bT1Z9uY3hL8gE1rU0lPqO9eZ6O',
    'INSPECTOR',
    'APPROVED'
) ON CONFLICT ("email") DO NOTHING;

-- 7. Sample Medicines
INSERT INTO "medicines" ("id", "name", "generic_name", "brand_name", "dosage_form", "strength", "storage_requirements")
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Deferasirox 500mg Tablets',
    'Deferasirox',
    'ThalassemiCure',
    'Oral Dispersible Tablet',
    '500mg',
    'Store below 30°C in dry place, protect from moisture'
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "medicines" ("id", "name", "generic_name", "brand_name", "dosage_form", "strength", "storage_requirements")
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'Hydroxyurea 500mg Capsules',
    'Hydroxyurea',
    'HydroCell',
    'Hard Capsule',
    '500mg',
    'Store at room temperature 15–30°C, away from light'
) ON CONFLICT ("id") DO NOTHING;
