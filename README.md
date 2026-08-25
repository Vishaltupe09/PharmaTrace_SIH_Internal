# 🛡️ PharmaTrace

> **Blockchain-Anchored Pharmaceutical Supply-Chain Traceability & Counterfeit Detection Platform**  
> *Built for Smart India Hackathon (SIH) — Production-Ready Live Prototype*

---

## 📌 Executive Summary

**PharmaTrace** solves the pharmaceutical trust deficit by establishing cryptographic provenance for every medicine batch. From synthesis to dispensing, every custody transition is permanently recorded as an immutable blockchain event. 

### Key Capabilities:
- 🏷️ **Cryptographic QR Provenance**: HMAC-SHA256 signed tamper-evident batch & package payloads.
- ⛓️ **EVM Smart Contracts**: Role-based access control, custodian validation, and emergency pause kill-switch.
- 🔄 **Deterministic Verification Pipeline**: Instant detection of expired, recalled, or duplicate cloned packages.
- 🧠 **Advisory AI Risk Engine**: Behavioral anomaly scoring (0–100) flagging routing violations and suspicious scan clusters.
- 🏛️ **Role-Based Portals**: Dedicated operational cockpits for Manufacturers, Distributors, Wholesalers, Pharmacies, Inspectors, and System Admins.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    U[Stakeholders: Mfr / Dist / Wholesaler / Pharmacy / Inspector / Consumer] --> FE[Frontend: React + Vite + Tailwind CSS]
    FE --> API[Backend API: Node.js + Express + TypeScript]
    API --> AUTH[RBAC & Rate Limiting Middleware]
    AUTH --> BL[Business Logic Services]
    BL --> DB[(PostgreSQL + Prisma ORM)]
    BL --> BS[Blockchain Service: Ethers.js v6]
    BS --> SC[Smart Contract: PharmaTrace.sol]
    SC --> CHAIN[(Hardhat Local / Polygon Amoy Testnet)]
    BL --> QR[QR Service: HMAC-SHA256]
    BL --> AI[AI Behavioral Risk Service]
    BL --> NOTIF[In-App Notification Service]
    BL --> AUD[Audit Logging Service]
```

---

## 👥 Demo Credentials & Seed Accounts

For instant hackathon demonstration, run `npm run seed` to populate these verified accounts:

| Role | Email | Password | Assigned Wallet / Org |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@pharmatrace.com` | `AdminPassword123!` | `0xf39F...2266` (Admin Console) |
| **Manufacturer** | `manufacturer@pharmatrace.com` | `Manufacturer123!` | ThalassemiCure Pharma Ltd. |
| **Distributor** | `distributor@pharmatrace.com` | `Distributor123!` | Apex National Logistics |
| **Wholesaler** | `wholesaler@pharmatrace.com` | `Wholesaler123!` | Metro Central Depot |
| **Pharmacy** | `pharmacy@pharmatrace.com` | `Pharmacy123!` | MedPlus Central Pharmacy |
| **Inspector** | `inspector@pharmatrace.com` | `Inspector123!` | CDSCO State Drug Inspectorate |
| **Consumer** | *Public Access (No Login)* | N/A | [Public Scanner](/verify) |

---

## 🚀 Quickstart & Local Deployment

### Prerequisites
- **Node.js**: v18+ or v20+
- **PostgreSQL**: Local instance or Docker container (`postgres:15-alpine`)
- **Git**

---

### Step 1: Clone & Configure Environment

```bash
git clone https://github.com/Vishaltupe09/PharmaTrace_SIH_Internal.git
cd PharmaTrace_SIH_Internal
```

Create `.env` in `backend/`:
```ini
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/pharmatrace?schema=public"
JWT_SECRET="pharmatrace_jwt_secret_dev_key_2026_sih"
JWT_REFRESH_SECRET="pharmatrace_jwt_refresh_dev_key_2026_sih"
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"

# Blockchain Configuration
RPC_URL="http://127.0.0.1:8545"
SIGNER_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
CHAIN_ID=31337
CONTRACT_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3"

# QR HMAC Signing Secret
QR_SIGNING_SECRET="pharmatrace_qr_hmac_secret_2026"
```

---

### Step 2: Start PostgreSQL Database (Docker)

```bash
cd database
docker compose up -d
cd ..
```

---

### Step 3: Start Local Blockchain & Deploy Contract

In **Terminal 1**:
```bash
cd blockchain
npm install
npx hardhat node
```

In **Terminal 2**:
```bash
cd blockchain
npx hardhat run scripts/deploy.ts --network localhost
```
*(Copy the deployed contract address into `backend/.env` as `CONTRACT_ADDRESS` if different).*

---

### Step 4: Setup Database & Start Backend API

In **Terminal 3**:
```bash
cd backend
npm install
npx prisma db push
npm run seed
npm run dev
```
Backend will start on `http://localhost:5000`.

---

### Step 5: Start Frontend Web App

In **Terminal 4**:
```bash
cd frontend
npm install
npm run dev
```
Frontend will start on `http://localhost:5173`.

---

## 🧪 Testing Strategy & Verification

### Run Smart Contract Unit Tests (Hardhat & Chai)
```bash
cd blockchain
npm test
```
*Executes 15 comprehensive unit tests covering batch registration, custody transfer authorization, role gating, recall states, and emergency pausable kill-switch.*

### Build Validation
```bash
# Backend compilation
npm --prefix backend run build

# Frontend production bundle
npm --prefix frontend run build
```

---

## 📦 Project Structure

```
PharmaTrace_SIH_Internal/
├── backend/                  # Node.js + Express + Prisma + Ethers.js
│   ├── src/
│   │   ├── controllers/      # Admin, Auth, Batch, Entity, Medicine, Shipment, Verify
│   │   ├── services/         # AI, Audit, Auth, Batch, Blockchain, Custody, Notification, QR
│   │   ├── middleware/       # JWT Authentication, RBAC, Rate Limiting, Zod Validation
│   │   ├── routes/           # REST API Route Declarations
│   │   └── cron/             # Automated AI Risk Score Recomputation
│   └── prisma/               # Schema and Database Seeding
├── blockchain/               # Hardhat + Solidity ^0.8.24 + TypeChain
│   ├── contracts/            # PharmaTrace.sol (AccessControl + Pausable)
│   ├── scripts/              # deploy.ts
│   └── test/                 # PharmaTrace.test.ts
├── frontend/                 # React 19 + Vite + Tailwind CSS v4
│   ├── src/
│   │   ├── api/              # Axios API Client with JWT Interceptors
│   │   ├── context/          # Auth Context State Management
│   │   ├── hooks/            # useNotifications hook
│   │   └── pages/            # Role Cockpits & Public Verification Portals
├── database/                 # PostgreSQL Docker Compose & SQL Schemas
└── docs/                     # PRD, Architecture, and Security Rules
```

---

## 📄 License & Team

Built with ❤️ for **Smart India Hackathon (SIH)**.  
Licensed under the **MIT License**.
