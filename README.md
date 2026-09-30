# 🛡️ PharmaTrace — Blockchain-Anchored Pharmaceutical Supply-Chain Traceability & Counterfeit Detection Platform

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-blue.svg?style=for-the-badge&logo=target)](https://www.sih.gov.in/)
[![Problem Statement](https://img.shields.io/badge/Problem%20Statement-SIH26194-orange.svg?style=for-the-badge)](https://www.sih.gov.in/)
[![Category](https://img.shields.io/badge/Category-Student%20Innovation%20(Blockchain)-purple.svg?style=for-the-badge)](https://www.sih.gov.in/)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.24-363636.svg?style=for-the-badge&logo=solidity)](https://soliditylang.org/)
[![Ethereum / Polygon](https://img.shields.io/badge/Blockchain-EVM%20%7C%20Polygon%20Amoy-8247E5.svg?style=for-the-badge&logo=polygon)](https://polygon.technology/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20TypeScript-339933.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Prisma%20ORM-4169E1.svg?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%20%7C%20Tailwind%20v4-61DAFB.svg?style=for-the-badge&logo=react)](https://reactjs.org/)

---

## 📑 Table of Contents
1. [Executive Summary & Hackathon Overview](#-executive-summary--hackathon-overview)
2. [Problem Statement (PS: SIH26194)](#-problem-statement-ps-sih26194)
3. [The PharmaTrace Solution](#-the-pharmatrace-solution)
4. [Real-Life Implementation & Industry Workflow](#-real-life-implementation--industry-workflow)
5. [System Architecture & Data Flow](#-system-architecture--data-flow)
6. [Core Technical Innovations](#-core-technical-innovations)
   - [On-Chain vs Off-Chain Data Matrix](#on-chain-vs-off-chain-data-matrix)
   - [Smart Contract Specification](#smart-contract-specification)
   - [HMAC-Signed QR Cryptographic Provenance](#hmac-signed-qr-cryptographic-provenance)
   - [Dual-Layer Verification (Deterministic + AI Anomaly)](#dual-layer-verification-pipeline)
7. [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
8. [Live Demonstration Credentials](#-live-demonstration-credentials)
9. [REST API Specification](#-rest-api-specification)
10. [Local Quickstart & Deployment Guide](#-local-quickstart--deployment-guide)
11. [Testing & Build Validation](#-testing--build-validation)
12. [Project Structure](#-project-structure)
13. [Future Roadmap & Regulatory Compliance](#-future-roadmap--regulatory-compliance)

---

## 📌 Executive Summary & Hackathon Overview

**PharmaTrace** is a decentralized, cryptographically verifiable supply-chain provenance and counterfeit detection platform designed specifically for the pharmaceutical sector under **Smart India Hackathon (SIH) Problem Statement SIH26194**. 

By uniting **Ethereum Virtual Machine (EVM) Smart Contracts**, **HMAC-SHA256 signed tamper-evident 2D QR matrix identifiers**, a high-performance **PostgreSQL/Prisma** transactional layer, and an **Unsupervised AI Risk Engine**, PharmaTrace eliminates the single point of failure in drug tracking, prevents counterfeit medicines from reaching pharmacies, enables automated 1-click drug recalls, and empowers every consumer to verify authenticity in milliseconds.

---

## 🎯 Problem Statement (PS: SIH26194)

### Background: The Counterfeit & Fragmented Drug Supply Chain Crisis
The World Health Organization (WHO) and regulatory bodies estimate that **over 10% to 30% of medicines in developing supply chains are substandard or falsified**, leading to treatment failures, antimicrobial resistance, and tragic loss of human lives.

| Critical Pain Point | Conventional Supply Chain Failure | Impact on Citizens & Industry |
| :--- | :--- | :--- |
| **Siloed & Paper Records** | Centralized databases across pharma manufacturers, C&F agents, stockists, and chemists do not talk to each other. | Inability to establish genuine chain-of-custody provenance. |
| **Cloned / Reused Barcodes** | Static 1D barcodes and standard QR codes can be easily photographed, duplicated, and stuck onto counterfeit batches. | Fake drugs circulate using genuine registration numbers. |
| **Slow Recall Propagation** | Recalls depend on circulars, phone calls, and manual distributor outreach, taking weeks or months. | Contaminated/expired drugs remain on retail shelves and reach patients. |
| **Zero Consumer Visibility** | Patients buying medicine at retail counters have no tamper-proof mechanism to verify provenance. | Zero consumer trust; vulnerability to illicit grey-market stock. |
| **No Audit Trail for Regulators** | Drug inspectors face manipulated physical registers and fragmented logbooks during spot audits. | Regulatory non-compliance and inability to fix accountability. |

---

## 💡 The PharmaTrace Solution

PharmaTrace establishes an unbroken **"Digital Chain of Custody"** from the moment of synthesis in the factory to retail dispensing at the pharmacy counter.

```mermaid
flowchart LR
    subgraph S1["1. Manufacturing"]
        M["Manufacturer registers batch on-chain"]
        QR["HMAC-Signed QR Codes generated"]
    end
    subgraph S2["2. Logistics & Distribution"]
        D["Distributor confirms receipt on-chain"]
        W["Wholesaler verifies custody hop"]
    end
    subgraph S3["3. Retail Pharmacy"]
        P["Chemist scans & verifies authenticity"]
        Disp["Dispensed to Consumer"]
    end
    subgraph S4["4. Public & Regulator"]
        C["Consumer scans QR via smartphone"]
        I["Inspector audits real-time provenance"]
    end

    S1 --> S2 --> S3 --> S4
```

### Key Highlights:
1. **Cryptographic Identity for Every Batch**: Unique UUID identifier registered on-chain with its cryptographic metadata hash (`SHA-256`).
2. **Deterministic Custody State Machine**: Each transfer (MFR → DIST → WHOLESALE → PHARMACY) is an on-chain transaction that requires `onlyCurrentCustodian` cryptographic authorization.
3. **Dual-Layer Anti-Counterfeit Verification**:
   - **Deterministic Security Rules** (Instant, Authoritative): Detects fake QRs, custodian mismatches, expiration, and active recalls.
   - **AI Anomaly Detection** (Behavioral, Advisory): Evaluates geographic scan clustering, velocity violations, and impossible hops.
4. **1-Click Emergency Recall Protocol**: An immediate on-chain status shift to `RECALLED` automatically invalidates all downstream verification scans and alerts all stakeholders who ever held the batch.

---

## 🏭 Real-Life Implementation & Industry Workflow

PharmaTrace is built from the ground up to mirror the real-world operational realities of the Indian and Global Pharmaceutical Supply Chain (compliant with CDSCO / GS1 standards).

```mermaid
sequenceDiagram
    autonumber
    actor MFR as 🏭 Manufacturer
    actor BC as ⛓️ EVM Smart Contract
    actor DIST as 🚚 Distributor / C&F
    actor PHARM as 💊 Retail Pharmacy
    actor USER as 📱 Consumer / Patient
    actor INSP as 🔍 CDSCO Drug Inspector

    MFR->>BC: registerBatch(batchId, metadataHash)
    Note over MFR,BC: On-Chain Batch Created + QR Generated
    MFR->>DIST: Dispatch shipment + transferCustody(batchId, distAddress)
    DIST->>BC: confirmReceipt(batchId)
    Note over DIST,BC: Custody Updated: IN_TRANSIT -> RECEIVED
    DIST->>PHARM: Ship to Chemist + transferCustody(batchId, pharmAddress)
    PHARM->>BC: confirmReceipt(batchId)
    Note over PHARM: Chemist scans QR & verifies authentic custody before stock entry
    USER->>PHARM: Purchases medicine
    USER->>BC: Scans QR with Smartphone (Public Verification Portal)
    Note over USER,BC: Returns VERIFIED_AUTHENTIC with full custody timeline
    INSP->>BC: Inspects on-chain transactions & anomaly risk dashboard
```

### Real-World Integration Touchpoints:
- **At the Production Line**: Automated label printers generate HMAC-signed 2D Data Matrix / QR codes affixed to secondary cartons and tertiary shipper boxes.
- **At the Warehouse (Distributors/Wholesalers)**: Handheld 2D optical barcode scanners integrate with PharmaTrace REST APIs for batch receipt and dispatch.
- **At Retail Chemists**: Point-of-Sale (POS) integration scans QR code upon receiving stock. System blocks non-custodied or recalled batches from being billed.
- **For Regulators (CDSCO / State Drug Authorities)**: Live audit dashboards monitor suspicious scan spikes, geographically impossible scans, and unauthorized transfer attempts.

---

## 🏛️ System Architecture & Data Flow

PharmaTrace follows a modern, decoupled layered architecture combining high-throughput Web2 technologies with high-trust Web3 decentralization:

```mermaid
flowchart TD
    subgraph UI["Frontend Presentation Layer (React 19 + Tailwind v4 + Vite)"]
        Landing["Public Landing & Educational Portal"]
        PublicScan["Camera / Manual QR Verification Portal"]
        Cockpits["Role-Based Dashboards (Admin / Mfr / Dist / Wholesaler / Pharmacy / Inspector)"]
    end

    subgraph API["Backend API Layer (Node.js + Express + TypeScript)"]
        AuthMid["JWT Auth + RBAC Middleware"]
        RateLim["Rate Limiting & Helmet Guard"]
        BatchCtrl["Batch & Medicine Controller"]
        CustodyCtrl["Custody & Shipment Controller"]
        VerifyCtrl["QR Verification & Hash Validator"]
        RecallCtrl["Emergency Recall Controller"]
    end

    subgraph CoreServices["Core Business & Security Services"]
        QREngine["QR Service (HMAC-SHA256 Sign/Verify)"]
        AIRisk["AI Anomaly Engine (Isolation Forest 0-100)"]
        AuditSvc["Comprehensive Audit Trail Logger"]
        NotifSvc["In-App Notification Dispatcher"]
        BlockSvc["Blockchain Bridge Service (Ethers.js v6)"]
    end

    subgraph Storage["Storage & Ledger Tier"]
        DB[(PostgreSQL Database + Prisma ORM)]
        SC["Smart Contract (PharmaTrace.sol)"]
        EVM[("EVM Ledger (Hardhat Local / Polygon Amoy)")]
    end

    UI --> AuthMid & RateLim
    AuthMid --> BatchCtrl & CustodyCtrl & VerifyCtrl & RecallCtrl
    BatchCtrl & CustodyCtrl & VerifyCtrl & RecallCtrl --> CoreServices
    CoreServices --> DB
    BlockSvc --> SC --> EVM
```

---

## 🔬 Core Technical Innovations

### On-Chain vs Off-Chain Data Matrix
To balance **zero-knowledge privacy**, **low gas cost**, and **regulatory data storage**, PharmaTrace implements an architectural split:

| Data Element | Storage Location | Technical Rationale |
| :--- | :---: | :--- |
| **Batch ID & Metadata Hash (`bytes32`)** | **On-Chain (Solidity)** | Cryptographic root of trust; tamper-proof proof of existence. |
| **Current Custodian Address** | **On-Chain (Solidity)** | Prevents unauthorized custody transfers and race conditions. |
| **Lifecycle Status (`Status` Enum)** | **On-Chain (Solidity)** | Authoritative source of truth (`CREATED`, `IN_TRANSIT`, `RECEIVED`, `FLAGGED`, `RECALLED`, `DISPENSED`). |
| **Custody Transition History** | **On-Chain (Indexed Events)** | Gas-efficient immutable audit log queried via event filters. |
| **Commercial Details & Storage Specs** | **Off-Chain (PostgreSQL)** | High volume, non-critical for trust verification; matches metadata hash. |
| **Scan Logs, Geolocation, IP Data** | **Off-Chain (PostgreSQL)** | High frequency data stream fed into AI behavioral analysis. |
| **Personally Identifiable Information (PII)** | **Off-Chain (Secure DB)** | Public blockchains are permanent; PII is never exposed on-chain. |

---

### Smart Contract Specification

The smart contract `PharmaTrace.sol` is written in **Solidity ^0.8.24**, utilizing **OpenZeppelin AccessControl** and **Pausable** modules.

```mermaid
stateDiagram-v2
    [*] --> CREATED: registerBatch() [MANUFACTURER_ROLE]
    CREATED --> IN_TRANSIT: transferCustody() [onlyCurrentCustodian]
    IN_TRANSIT --> RECEIVED: confirmReceipt() [onlyRecipient]
    RECEIVED --> IN_TRANSIT: transferCustody() [next hop]
    RECEIVED --> DISPENSED: dispense() [PHARMACY_ROLE]
    
    CREATED --> FLAGGED: flagBatch() [Any Authorized Role]
    IN_TRANSIT --> FLAGGED: flagBatch()
    RECEIVED --> FLAGGED: flagBatch()
    
    CREATED --> RECALLED: recallBatch() [DEFAULT_ADMIN_ROLE / MFR]
    IN_TRANSIT --> RECALLED: recallBatch()
    RECEIVED --> RECALLED: recallBatch()
    FLAGGED --> RECALLED: recallBatch()
```

#### Key Smart Contract Functions:
- `registerBatch(bytes32 batchId, bytes32 metadataHash)`: Initializes batch with caller as initial custodian.
- `transferCustody(bytes32 batchId, address to)`: Updates state to `IN_TRANSIT` and designates new custodian.
- `confirmReceipt(bytes32 batchId)`: Finalizes custody transition to `RECEIVED`.
- `flagBatch(bytes32 batchId, string reason)`: Marks batch as suspicious for regulatory inspection.
- `recallBatch(bytes32 batchId, string reason)`: Emergency halt on all trading/dispensing of the batch.
- `pause() / unpause()`: Circuit breaker for emergency administrative freeze.

---

### HMAC-Signed QR Cryptographic Provenance

Standard QR codes fail because they can be easily cloned. PharmaTrace uses **HMAC-SHA256 Cryptographic Signing**:

```json
{
  "payload": {
    "id": "c3f81e64-1029-4b2a-9f5e-827103a6d418",
    "type": "batch",
    "nonce": "a7b8e9102c3d4e5f",
    "issuedAt": 1727712000000
  },
  "signature": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```
1. Backend signs the canonical payload using a server-side hardware-secured key `QR_SIGNING_SECRET`.
2. When scanned, the system recomputes the HMAC signature. Any tampered payload fails signature validation immediately (`INVALID_QR`).

---

### Dual-Layer Verification Pipeline

```mermaid
flowchart TD
    Scan["User / Pharmacy Scans QR Code"] --> Dec["Decode Payload & Validate Format"]
    Dec --> SigCheck{"Verify HMAC Signature"}
    
    SigCheck -- "Failed" --> RetInv["❌ INVALID_QR (Tamper Detected)"]
    SigCheck -- "Passed" --> DBCheck{"Match Off-Chain Record"}
    
    DBCheck -- "Not Found" --> RetUnk["❌ UNKNOWN_PRODUCT"]
    DBCheck -- "Found" --> HashCheck{"Compare SHA-256 Hash with On-Chain Root"}
    
    HashCheck -- "Mismatch" --> RetSusp["⚠️ SUSPICIOUS_METADATA_MISMATCH"]
    HashCheck -- "Match" --> RecCheck{"Is Batch Recalled on Chain?"}
    
    RecCheck -- "Yes" --> RetRec["🛑 RECALLED (Immediate Block)"]
    RecCheck -- "No" --> ExpCheck{"Is Expiry Date < Current Date?"}
    
    ExpCheck -- "Yes" --> RetExp["⚠️ EXPIRED"]
    ExpCheck -- "No" --> DetAuth["✅ Deterministic Validation PASSED"]
    
    DetAuth --> AI["🧠 AI Behavioral Risk Engine (Async Isolation Forest)"]
    AI --> Scored{"Risk Score (0-100)"}
    Scored -- "0 - 30" --> RetAuth["✅ VERIFIED_AUTHENTIC (Low Risk)"]
    Scored -- "31 - 60" --> RetFlag["⚠️ VERIFIED_BUT_FLAGGED (Moderate Anomaly)"]
    Scored -- "61 - 100" --> RetRisk["🚨 HIGH_RISK_SUSPICIOUS (Cloning / Impossible Hop Detected)"]
```

#### Deterministic vs AI Authority:
- **Deterministic Rules are Authoritative**: An expired, recalled, or signature-failed batch is immediately rejected. AI can **never** downgrade a security failure to "authentic".
- **AI Engine is Advisory**: AI calculates behavioral anomalies (e.g., duplicate scans in 2 cities within 10 minutes) and surfaces risk scores to dashboards.

---

## 👥 Role-Based Access Control (RBAC)

PharmaTrace features 7 distinct persona cockpits with strict server-side RBAC and on-chain gating:

| Role | Primary Purpose | On-Chain Permissions | Key Dashboard Capabilities |
| :--- | :--- | :--- | :--- |
| **System Admin** | Platform Governance & Regulation | `DEFAULT_ADMIN_ROLE`, `pauseContract()`, `recallBatch()` | Entity approvals, system health, audit logs, emergency pause. |
| **Manufacturer** | Drug Production & Provenance | `MANUFACTURER_ROLE`, `registerBatch()`, `transferCustody()` | Batch creation, QR generator, dispatch management, recall initiation. |
| **Distributor** | National/Regional Logistics | `DISTRIBUTOR_ROLE`, `confirmReceipt()`, `transferCustody()` | Inbound receipt confirmation, outbound transfers, dispatch manifests. |
| **Wholesaler** | Bulk Storage & City Distribution | `WHOLESALER_ROLE`, `confirmReceipt()`, `transferCustody()` | Sub-depot inventory, pharmacy transfers, route verification. |
| **Pharmacy** | Point-of-Care & Dispensing | `PHARMACY_ROLE`, `confirmReceipt()`, `flagBatch()` | Inventory scanner, fake drug detection, dispensing logs, recall alerts. |
| **Drug Inspector**| CDSCO Regulatory Oversight | Read-Only Blockchain Auditing | Supply chain search, custody tree visualizer, AI risk score feed. |
| **Consumer** | End-User Verification | Public Read-Only Access | Camera scanner, provenance timeline, authenticity certification. |

---

## 🔑 Live Demonstration Credentials

To evaluate the platform during hackathon judging, run `npm run seed` in `backend/` to populate pre-configured accounts:

| Role | Email Address | Password | Organization / Wallet Context |
| :--- | :--- | :--- | :--- |
| 🛡️ **System Admin** | `admin@pharmatrace.com` | `AdminPassword123!` | System Central Authority (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`) |
| 🏭 **Manufacturer** | `manufacturer@pharmatrace.com` | `Manufacturer123!` | ThalassemiCure Pharma Ltd. |
| 🚚 **Distributor** | `distributor@pharmatrace.com` | `Distributor123!` | Apex National Logistics |
| 📦 **Wholesaler** | `wholesaler@pharmatrace.com` | `Wholesaler123!` | Metro Central Depot |
| 💊 **Pharmacy** | `pharmacy@pharmatrace.com` | `Pharmacy123!` | MedPlus Central Pharmacy |
| 🔍 **Inspector** | `inspector@pharmatrace.com` | `Inspector123!` | CDSCO State Drug Inspectorate |
| 📱 **Consumer** | *Public / No Login Required* | *N/A* | Public Scanner: `http://localhost:5173/verify` |

---

## 📡 REST API Specification

| Endpoint | Method | Role / Auth | Description |
| :--- | :---: | :---: | :--- |
| `/api/auth/login` | `POST` | Public | Authenticate user & issue JWT Access + Refresh tokens |
| `/api/auth/register` | `POST` | Public | Submit registration for administrative approval |
| `/api/manufacturers/batches` | `POST` | `MANUFACTURER` | Register new batch, compute hash, deploy to blockchain |
| `/api/manufacturers/batches` | `GET` | `MANUFACTURER` | List all batches created by authenticated manufacturer |
| `/api/shipments/:id/transfer` | `POST` | `CURRENT_CUSTODIAN` | Transfer batch custody to next downstream entity |
| `/api/shipments/:id/receive` | `POST` | `RECIPIENT` | Confirm receipt of shipment and update on-chain status |
| `/api/verify/scan` | `POST` | Public (Rate Limited) | Verify HMAC payload, query blockchain, return result state |
| `/api/batches/:id/recall` | `POST` | `ADMIN` / `MANUFACTURER` | Trigger immediate on-chain batch recall with reason |
| `/api/medicines/:id/history` | `GET` | Authenticated | Fetch full unified timeline (Database + On-Chain Events) |
| `/api/admin/risk-dashboard` | `GET` | `ADMIN` / `INSPECTOR` | Fetch AI anomaly distribution and high-risk flagged batches |
| `/api/admin/audit-logs` | `GET` | `ADMIN` / `INSPECTOR` | Query immutable system audit logs with transaction hashes |

---

## 🚀 Local Quickstart & Deployment Guide

### Prerequisites
- **Node.js**: v18+ or v20+
- **PostgreSQL**: Local instance or Docker Compose
- **Git**

---

### Step 1: Clone Repository & Setup Environment
```bash
git clone https://github.com/Vishaltupe09/PharmaTrace_SIH_Internal.git
cd PharmaTrace_SIH_Internal
```

Create `.env` inside `backend/`:
```ini
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/pharmatrace?schema=public"
JWT_SECRET="pharmatrace_jwt_secret_dev_key_2026_sih"
JWT_REFRESH_SECRET="pharmatrace_jwt_refresh_dev_key_2026_sih"
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"

# Blockchain Configuration (Hardhat Local Node)
RPC_URL="http://127.0.0.1:8545"
SIGNER_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
CHAIN_ID=31337
CONTRACT_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3"

# QR HMAC Secret
QR_SIGNING_SECRET="pharmatrace_qr_hmac_secret_2026"
```

---

### Step 2: Launch PostgreSQL Database via Docker
```bash
cd database
docker compose up -d
cd ..
```

---

### Step 3: Start Local Blockchain & Deploy Smart Contract

**Terminal 1 (Local Hardhat EVM Node):**
```bash
cd blockchain
npm install
npx hardhat node
```

**Terminal 2 (Deploy Contract):**
```bash
cd blockchain
npx hardhat run scripts/deploy.ts --network localhost
```
*(Verify that the deployed contract address matches `CONTRACT_ADDRESS` in `backend/.env`).*

---

### Step 4: Seed Database & Start Backend API Server

**Terminal 3:**
```bash
cd backend
npm install
npx prisma db push
npm run seed
npm run dev
```
*Backend API service starts at `http://localhost:5000`.*

---

### Step 5: Start Frontend Web Application

**Terminal 4:**
```bash
cd frontend
npm install
npm run dev
```
*Frontend web application starts at `http://localhost:5173`.*

---

## 🧪 Testing & Build Validation

### Smart Contract Unit Test Suite
```bash
cd blockchain
npm test
```
*Executes 15 comprehensive unit tests verifying:*
- Role-based batch initialization
- Unauthorized transfer reversion
- Custodian state transitions
- Emergency `pause()` / `unpause()` circuit breaker
- Batch recall cascade rules

### Full-Stack Build Verification
```bash
# Build Backend TypeScript
npm --prefix backend run build

# Build Frontend Bundle
npm --prefix frontend run build
```

---

## 📂 Project Structure

```
PharmaTrace_SIH_Internal/
├── backend/                       # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── controllers/           # Auth, Batch, Entity, Medicine, Shipment, Verify, Admin
│   │   ├── services/              # Blockchain, QR, AI Risk, Custody, Audit, Notification
│   │   ├── middleware/            # JWT Auth, RBAC Guards, Rate Limiter, Zod Validation
│   │   ├── routes/                # REST API Endpoint Mappings
│   │   └── cron/                  # Automated AI Anomaly Recomputation Cron
│   └── prisma/                    # PostgreSQL Schema Definition & Seed Scripts
├── blockchain/                    # Hardhat Ethereum Development Environment
│   ├── contracts/                 # PharmaTrace.sol (Solidity ^0.8.24)
│   ├── scripts/                   # deploy.ts (Multi-network deployment script)
│   └── test/                      # Hardhat + Chai Smart Contract Unit Tests
├── frontend/                      # React 19 + Vite + Tailwind CSS v4
│   ├── src/
│   │   ├── api/                   # Axios Client with JWT Refresh Interceptors
│   │   ├── context/               # Global Authentication & Session Context
│   │   ├── components/            # Reusable UI Components, Modals, Navbar, QR Scanner
│   │   └── pages/                 # Role Cockpits (Admin, Mfr, Dist, Pharmacy, Inspector, Public)
│   └── public/                    # Static Assets, Icons, and Manifests
├── database/                      # PostgreSQL Docker Compose & Standalone SQL Seeds
└── docs/                          # Product Requirements Document (PRD), Architecture & Rules
```

---

## 🔮 Future Roadmap & Regulatory Compliance

- [ ] **GS1 Digital Link Compliance**: Alignment with GS1 DataMatrix 2D standards for seamless global export compliance.
- [ ] **Decentralized Storage (IPFS / Filecoin)**: Pinning laboratory Certificate of Analysis (CoA) PDFs directly to IPFS hashes on-chain.
- [ ] **IoT Cold-Chain Telemetry**: Automated smart contract flagging if temperature or humidity exceeds critical thresholds during transit.
- [ ] **Zero-Knowledge Proofs (zk-SNARKs)**: Enabling private commercial invoice validation without leaking trade volumes on public ledgers.
- [ ] **Mobile Native Application**: Flutter / React Native build with offline scanning and geofence-assisted validation.

---

## 👥 Team & Submission Information

- **Smart India Hackathon (SIH 2026)**
- **Problem Statement ID:** `SIH26194`
- **Project Name:** PharmaTrace
- **Repository:** [https://github.com/Vishaltupe09/PharmaTrace_SIH_Internal.git](https://github.com/Vishaltupe09/PharmaTrace_SIH_Internal.git)
- **License:** MIT Open Source License
