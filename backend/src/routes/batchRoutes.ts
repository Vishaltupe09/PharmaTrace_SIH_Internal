import { Router } from "express";
import {
  handleCreateBatch,
  getBatches,
  getBatchById,
  handleRecallBatch,
} from "../controllers/batchController";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { validateBody } from "../middleware/validateMiddleware";
import { z } from "zod";

const router = Router();

const createBatchSchema = z.object({
  medicineId: z.string().uuid(),
  batchNumber: z.string().min(1),
  mfgDate: z.string(),
  expiryDate: z.string(),
  quantity: z.number().int().positive(),
  packageCount: z.number().int().nonnegative().optional(),
});

router.use(authenticate);

router.post(
  "/",
  authorize("MANUFACTURER"),
  validateBody(createBatchSchema),
  handleCreateBatch
);

router.get("/", getBatches);
router.get("/:id", getBatchById);

router.post(
  "/:id/recall",
  authorize("ADMIN", "MANUFACTURER"),
  handleRecallBatch
);

export default router;
