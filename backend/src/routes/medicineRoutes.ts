import { Router } from "express";
import { createMedicine, getMedicines } from "../controllers/medicineController";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticate);

router.post("/", authorize("ADMIN", "MANUFACTURER"), createMedicine);
router.get("/", getMedicines);

export default router;
