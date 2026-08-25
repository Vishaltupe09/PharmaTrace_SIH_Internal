/**
 * entityRoutes.ts
 * Routes for querying approved supply-chain entities.
 * Used by frontend transfer modals to populate recipient dropdowns.
 */

import { Router } from "express";
import { getEntitiesByRole, getMyEntity } from "../controllers/entityController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

// All entity routes require authentication (UX-level RBAC enforcement; server-side business
// logic validates roles on actual transfer/receipt calls)
router.use(authenticate);

// GET /api/entities?role=DISTRIBUTOR|WHOLESALER|PHARMACY
// Returns list of approved entities for the given role
router.get("/", getEntitiesByRole);

// GET /api/entities/me
// Returns the caller's own entity profile
router.get("/me", getMyEntity);

export default router;
