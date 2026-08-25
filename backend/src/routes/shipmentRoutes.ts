import { Router } from "express";
import {
  handleTransferCustody,
  handleConfirmReceipt,
  getShipments,
} from "../controllers/shipmentController";
import { authenticate, authorize } from "../middleware/authMiddleware";
import { validateBody } from "../middleware/validateMiddleware";
import { z } from "zod";

const router = Router();

const transferSchema = z.object({
  batchId: z.string().uuid(),
  fromEntityId: z.string().uuid(),
  toEntityId: z.string().uuid(),
});

router.use(authenticate);

router.post(
  "/transfer",
  authorize("MANUFACTURER", "DISTRIBUTOR", "WHOLESALER", "PHARMACY"),
  validateBody(transferSchema),
  handleTransferCustody
);

router.post(
  "/:id/receive",
  authorize("DISTRIBUTOR", "WHOLESALER", "PHARMACY"),
  handleConfirmReceipt
);

router.get("/", getShipments);

export default router;
