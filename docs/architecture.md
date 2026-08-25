# PharmaTrace — architecture.md
Agent context file. Read this alongside `PharmaTrace_PRD.md` (full spec) and `rules.md` (build constraints). This file defines **what to build and how the pieces connect** — treat it as the technical map.

## 1. Tech Stack (final — do not substitute without asking)
- **Frontend:** React + Vite + Tailwind CSS, React Router, React Query, Axios.
- **Backend:** Node.js + Express, TypeScript.
- **Database:** PostgreSQL, Prisma ORM.
- **Blockchain:** Solidity ^0.8.24, Hardhat, OpenZeppelin (`AccessControl`, `Pausable`), Ethers.js v6.
- **Networks:** local Hardhat node (primary dev/demo) + Polygon Amoy testnet (secondary public-proof deployment).
- **Auth:** JWT access + refresh tokens, bcrypt/argon2 password hashing.
- **QR:** `qrcode` (generation), `html5-qrcode` (scanning), HMAC-SHA256 signed payloads.
- **AI:** Isolation Forest (or weighted rule-based fallback), runs as an in-process Node module — not a separate microservice for MVP.

## 2. Monorepo Layout
```
pharmatrace/
├── frontend/src/{pages,components,api,context,hooks}
├── backend/src/{controllers,services,models,middleware,routes}
├── blockchain/{contracts,scripts,test}
├── ai-service/riskEngine.ts
├── docs/{PharmaTrace_PRD.md, architecture.md, design.md, rules.md}
├── .env.example
└── README.md
```

## 3. High-Level Data Flow
```
User → Frontend → Backend API → Auth/RBAC middleware → Business logic (services)
  services → PostgreSQL (off-chain data)
  services → blockchainService → Smart Contract → Hardhat/Amoy chain
  services → qrService (generate/verify signed QR payloads)
  services → aiService (risk scoring, advisory only)
  services → auditService (writes audit_logs on every state change)
  services → notificationService (in-app alerts)
```

## 4. Backend Layering (strict — agent must follow this separation)
- `controllers/` — parse HTTP request, call one service, shape response. No business logic here.
- `services/` — all business logic lives here: `authService`, `batchService`, `custodyService`, `qrService`, `blockchainService`, `aiService`, `auditService`, `notificationService`.
- `blockchainService` is the **only** module allowed to import Ethers.js or touch the contract ABI. Controllers/other services never call the chain directly.
- `models/` — Prisma client access only.
- `middleware/` — `authenticate` (verify JWT), `authorize(role)` (RBAC gate), `rateLimit`, `validate(schema)`.

## 5. Blockchain Architecture
- Contract: `PharmaTrace.sol` (already scaffolded in `blockchain/contracts/`). Roles via OpenZeppelin `AccessControl`: `MANUFACTURER_ROLE`, `DISTRIBUTOR_ROLE`, `WHOLESALER_ROLE`, `PHARMACY_ROLE`, plus `DEFAULT_ADMIN_ROLE`.
- On-chain: batch ID, metadata hash, current custodian, status enum, timestamps, all custody-transfer/flag/recall events.
- Off-chain (Postgres): medicine/batch descriptive fields, shipments, verification logs, risk scores, security events, audit logs.
- **Never** put PII or high-frequency data (scan logs) on-chain.
- Transaction lifecycle: write DB row as `PENDING` → send tx → on receipt update to `CONFIRMED` + store `tx_hash` → on revert/failure mark `FAILED` and surface a retry-able error. Never mark a row confirmed without an actual tx receipt.
- Wallets: one backend-custodied wallet per business account for MVP (key held server-side via env/secrets manager, never sent to the frontend).

## 6. Database (Prisma models — see PRD §21 for full field list)
Core tables: `users`, `manufacturers`, `distributors`, `wholesalers`, `pharmacies`, `medicines`, `batches`, `packages`, `shipments`, `custody_transfers`, `verification_records`, `qr_codes`, `recalls`, `risk_scores`, `security_events`, `audit_logs`. Enforce uniqueness at the DB level for `batch_number`, `license_no`, `wallet_address`, `qr_id`.

## 7. QR Architecture
Payload = `{id, type, nonce, issuedAt}` signed with `QR_SIGNING_SECRET` (HMAC). QR encodes `{payload, signature}` + a verification URL — never raw medicine data. Verification endpoint recomputes the signature before trusting the payload.

## 8. AI/Risk Architecture
Pipeline: event → deterministic rules (authoritative) → AI anomaly score (advisory, async/batch, never blocks verification). Deterministic rules always win: `RECALLED`/`EXPIRED`/`INVALID_QR` can never be overridden by a low risk score.

## 9. API Surface
See PRD §20 for the full endpoint table. Every mutating endpoint: validate → authorize → business logic → (optional chain call via `blockchainService`) → audit log → response.

## 10. Verification State Machine
`CREATED → IN_TRANSIT → RECEIVED → (FLAGGED | RECALLED | DISPENSED)`. Verification-result states (returned by `/api/verify/scan`): `VERIFIED_AUTHENTIC, VERIFIED_BUT_FLAGGED, EXPIRED, RECALLED, INVALID_QR, UNKNOWN_PRODUCT, SUSPICIOUS_DUPLICATE, UNAUTHORIZED_TRANSFER, VERIFICATION_FAILED`.

## 11. Environment Variables
`DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, RPC_URL, SIGNER_PRIVATE_KEY, QR_SIGNING_SECRET, NODE_ENV, CORS_ORIGIN` — see `.env.example`. Never hardcode or expose these to the frontend bundle.
