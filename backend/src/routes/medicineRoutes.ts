import { Router } from "express";
import { createMedicine, getMedicines, flagMedicine, getBatchHistory } from "../controllers/medicineController";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { validateBody } from "../middleware/validateMiddleware";
import { z } from "zod";

const router = Router();

router.use(authenticate);

router.post("/", authorize("ADMIN", "MANUFACTURER"), createMedicine);
router.get("/", getMedicines);

// POST /api/medicines/:id/flag
router.post(
  "/:id/flag",
  authorize("PHARMACY", "INSPECTOR", "ADMIN"),
  validateBody(z.object({ reason: z.string().min(1) })),
  flagMedicine
);

// GET /api/medicines/:id/history (batch history + custody timeline)
router.get("/:id/history", getBatchHistory);

export default router;
