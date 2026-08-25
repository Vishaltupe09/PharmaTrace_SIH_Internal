# PharmaTrace

Blockchain-based pharmaceutical supply-chain traceability and counterfeit-detection MVP built for Smart India Hackathon.

See `docs/PharmaTrace_PRD.md` for the full Product Requirements Document — this is the source of truth for implementation (roles, workflows, smart contract spec, API spec, DB schema, AI architecture, threat model, roadmap, and acceptance criteria).

## Folder structure
- `frontend/` — React + Vite + Tailwind
- `backend/` — Node.js + Express API
- `blockchain/` — Solidity contracts + Hardhat
- `ai-service/` — risk-scoring module
- `docs/` — PRD and supporting docs

## Getting started
1. Copy `.env.example` to `.env` in `backend/` and `blockchain/`, fill in real values (never commit).
2. `cd blockchain && npm install && npx hardhat node` (separate terminal)
3. `cd blockchain && npx hardhat run scripts/deploy.ts --network localhost`
4. `cd backend && npm install && npm run dev`
5. `cd frontend && npm install && npm run dev`

Follow the Development Roadmap in the PRD (Section 32) for build order.
