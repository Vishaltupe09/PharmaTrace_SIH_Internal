# PharmaTrace — Rules & Hard Constraints

These hard constraints override developer convenience or shortcuts. All backend, blockchain, and frontend modules must strictly follow them.

## 1. Blockchain Layer Boundaries
- **Only `blockchainService` may import Ethers.js or hold/reference the smart contract ABI.**
- Controllers, routes, and other services must interact with the blockchain strictly through `blockchainService` methods.
- Raw private keys or Web3 instances must never leak outside `blockchainService`.

## 2. On-Chain State & Transaction Confirmation
- **Never mark a DB row reflecting on-chain state as `CONFIRMED` without a verified transaction receipt.**
- All state-changing operations write off-chain state with `chain_status = PENDING`.
- Once the transaction is mined and confirmed via receipt, `chain_status` is updated to `CONFIRMED` and `tx_hash` is recorded.
- If a transaction reverts or fails, `chain_status` must be set to `FAILED`.

## 3. Server-Side Security, Input Validation & Audit Logging
- **Every mutating endpoint must validate input schema (Zod/Joi), enforce RBAC server-side, and write an audit log entry.**
- Role enforcement on the frontend is UX-only; backend API middleware is the true authority.
- Every state-changing action must create an entry in `audit_logs` containing actor ID, role, action, target entity, timestamp, and optional `tx_hash`.

## 4. Deterministic Verification & AI Guardrails
- **The AI risk score must NEVER override or suppress a deterministic security result.**
- If a medicine/batch is `RECALLED`, `EXPIRED`, `INVALID_QR`, or has an `UNAUTHORIZED_TRANSFER`, the deterministic outcome is authoritative.
- The AI risk score is strictly advisory (0-100) and enriches admin/inspector dashboards.

## 5. Secret & Private Key Management
- **No secret, private key, API secret, or JWT signing key may appear in source code, comments, logs, or frontend bundles.**
- All secrets must be loaded via environment variables matching `.env.example`.
- Wallet private keys for backend-custodied wallets must be stored securely and never exposed over HTTP responses or logs.

## 6. Scope Boundaries
- **Stay inside MVP Scope (PRD §33).**
- Do not implement Future Scope items (IoT sensors, ZK proofs, zero-knowledge privacy, hardware holograms, etc.) unless explicitly requested.
