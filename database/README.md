# PharmaTrace Database Architecture & Setup Guide

This directory contains the database definition, initialization scripts, seed data, and Docker deployment configuration for **PharmaTrace** in strict accordance with **PRD §21 (Database Schema)** and **architecture.md §6**.

---

## 1. Directory Overview

```
database/
├── schema.sql           # Pure PostgreSQL DDL for all 16 tables, enums, & indexes
├── seed.sql             # SQL seed script with pre-configured demo actors & medicines
├── docker-compose.yml   # Standalone Docker container configuration for PostgreSQL
└── README.md            # Architecture, ER relationships, & setup instructions
```

---

## 2. Entity-Relationship Overview

| Table Name | Primary Key | Foreign Key Relations | Description |
| :--- | :--- | :--- | :--- |
| `users` | `id` (UUID) | — | System accounts with bcrypt password hashes, RBAC roles, and assigned custodial wallets |
| `manufacturers` | `id` (UUID) | `user_id` $\rightarrow$ `users(id)` | Registered manufacturer business profile with license & wallet |
| `distributors` | `id` (UUID) | `user_id` $\rightarrow$ `users(id)` | Logistics distributor profile with license & wallet |
| `wholesalers` | `id` (UUID) | `user_id` $\rightarrow$ `users(id)` | Regional wholesale hub profile with license & wallet |
| `pharmacies` | `id` (UUID) | `user_id` $\rightarrow$ `users(id)` | Retail pharmacy & dispensary profile with license & wallet |
| `medicines` | `id` (UUID) | — | Product-level formulations (name, brand, dosage form, strength) |
| `batches` | `id` (UUID) | `medicine_id`, `manufacturer_id` | Core production batch, SHA-256 metadata hash, on-chain state, tx hash |
| `packages` | `id` (UUID) | `batch_id` $\rightarrow$ `batches(id)` | Individual unit/package identifiers within a batch |
| `shipments` | `id` (UUID) | `batch_id` $\rightarrow$ `batches(id)` | Transit transfers between supply chain entities (`IN_TRANSIT` $\rightarrow$ `RECEIVED`) |
| `custody_transfers` | `id` (UUID) | `batch_id` $\rightarrow$ `batches(id)` | On-chain custody movement logs with sender/receiver addresses & tx hashes |
| `verification_records`| `id` (UUID) | `scanned_by_user_id` $\rightarrow$ `users(id)` | QR scan history, GPS coordinates, verification result state |
| `qr_codes` | `id` (UUID) | `batch_id`, `package_id` | HMAC-SHA256 signed QR payloads |
| `recalls` | `id` (UUID) | `batch_id` $\rightarrow$ `batches(id)` | Batch recall orders with audit reasons & on-chain tx hashes |
| `risk_scores` | `id` (UUID) | `batch_id` $\rightarrow$ `batches(id)` | AI behavioral anomaly scores (0–100) & risk factors (JSONB) |
| `security_events` | `id` (UUID) | — | Security anomaly alerts (duplicate scans, tampered signatures) |
| `audit_logs` | `id` (UUID) | `actor_user_id` $\rightarrow$ `users(id)` | Immutable server-side audit trails for mutating operations |

---

## 3. Database Initialization Methods

### Option A: Using Prisma ORM (Recommended)
From the `backend/` directory:
```bash
cd backend
npx prisma db push
npm run seed
```

### Option B: Using Docker Compose
From the `database/` directory:
```bash
cd database
docker compose up -d
```
*The container will automatically execute `schema.sql` and `seed.sql` on startup.*

### Option C: Using PostgreSQL CLI (`psql`)
```bash
psql -U postgres -d pharmatrace -f database/schema.sql
psql -U postgres -d pharmatrace -f database/seed.sql
```

---

## 4. Pre-Configured Demo Credentials

| Role | Email | Password | Pre-Assigned Wallet Address |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@pharmatrace.com` | `AdminPassword123!` | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |
| **Manufacturer** | `manufacturer@pharmatrace.com` | `Manufacturer123!` | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` |
| **Distributor** | `distributor@pharmatrace.com` | `Distributor123!` | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` |
| **Wholesaler** | `wholesaler@pharmatrace.com` | `Wholesaler123!` | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` |
| **Pharmacy** | `pharmacy@pharmatrace.com` | `Pharmacy123!` | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` |
| **Inspector** | `inspector@pharmatrace.com` | `Inspector123!` | Read-only privileged account |
