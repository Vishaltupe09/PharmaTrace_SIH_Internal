# PharmaTrace — Backend & Blockchain Notes

This document tracks the inventory of existing scaffold components, implementation status, and remaining work items across Phase A, Phase B, and Phase C.

---

## 1. Inventory & Module Status

### Blockchain Module (`blockchain/`)
- [x] **Smart Contract (`contracts/PharmaTrace.sol`)**: Solidity ^0.8.24 implementation with OpenZeppelin `AccessControl` and `Pausable`.
- [x] **Hardhat Configuration (`hardhat.config.ts`)**: Configured for local node (Chain ID 31337) and Polygon Amoy testnet.
- [x] **Unit Test Suite (`test/PharmaTrace.test.ts`)**: 15 unit tests passing (100% pass rate) covering contract deployment, batch registration, custody transfer, receipt confirmation, flagging, recalls, and role access control.
- [x] **Deployment & Verification (`scripts/deploy.ts`, `scripts/verify_getBatch.ts`)**: Deployed contract to local Hardhat node at `0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e` and verified `getBatch()` calls.

### Backend Module (`backend/`)
- [x] **Contract ABI Integration (`src/contracts/PharmaTrace.abi.json`)**: Real compiled ABI synced from Hardhat build artifacts (36 entries).
- [x] **Prisma Database Schema & Seeding (`prisma/schema.prisma`, `prisma/seed.ts`)**: Full schema defined for all PRD §21 entities, PostgreSQL database synced, demo Admin user and medicine data seeded.
- [x] **Admin Controller (`src/controllers/adminController.ts`)**: `approveUser` endpoint with backend-custodied wallet generation/assignment & `grantEntityRole` call.
- [x] **Services (`src/services/`)**:
  - `blockchainService`: Only layer importing Ethers.js. Wraps `registerBatch`, `transferCustody`, `confirmReceipt`, `flagBatch`, `recallBatch`, `getBatch`, `grantEntityRole`.
  - `qrService`: HMAC payload signing, QR image generation, package-level QR support (`type: "package"`).
  - `aiService`: Risk scoring engine with scheduled platform-wide recomputation (`node-cron` every 15 min & Admin trigger endpoint).
  - `batchService`: Batch creation, metadata hash calculation, package QR creation.
  - `custodyService`: Transfer initiation and receipt confirmation workflows.
  - `auditService`: Audit log and security event tracking.
- [x] **Routes & Controllers (`src/routes/`, `src/controllers/`)**: Auth, Admin, Batch, Shipment, Verify (rate-limited), Medicine endpoints.

---

## 2. Task Execution Checklist

### Phase A — Blockchain [COMPLETED]
- [x] Initialize Hardhat scaffold in `blockchain/`.
- [x] Run `npm install` and `npx hardhat compile`.
- [x] Run `npx hardhat test` and verify 100% pass rate (15/15 tests passing).
- [x] Sync compiled ABI to `backend/src/contracts/PharmaTrace.abi.json`.
- [x] Deploy to local Hardhat node and verify contract state queries (`getBatch`).

### Phase B — Backend [COMPLETED]
- [x] Wire wallet assignment into `adminController.approveUser` (`users.walletAddress` & `grantEntityRole`).
- [x] Implement scheduled/cron platform-wide AI risk score recomputation (`node-cron` & `POST /api/admin/ai/recompute-scores`).
- [x] Support package-level QR generation in `batchService`/`qrService` (`type: "package"`).

### Phase C — Validation & Acceptance [COMPLETED]
- [x] Run `npx prisma db push` and `npx ts-node prisma/seed.ts`; confirm demo Admin can log in (`admin@pharmatrace.com`).
- [x] End-to-end custody chain integration test (`tests/custodyChain.test.ts`): Manufacturer creates batch -> transfers to Distributor -> Distributor confirms -> transfers to Wholesaler -> Wholesaler confirms -> transfers to Pharmacy -> Pharmacy confirms -> Pharmacy/Consumer scans QR and receives `VERIFIED_AUTHENTIC` response.
- [x] Fraud path integration test (`tests/fraudPaths.test.ts`): Tampered QR signature returns `INVALID_QR`, recalled batch always returns `RECALLED` overriding other state.
- [x] Verification against PRD §36 Acceptance Criteria — 100% satisfied.
