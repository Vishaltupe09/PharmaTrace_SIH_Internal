import { Router } from "express";
import { register, login } from "../controllers/authController";
import { validateBody } from "../middleware/validateMiddleware";
import { z } from "zod";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["MANUFACTURER", "DISTRIBUTOR", "WHOLESALER", "PHARMACY", "INSPECTOR"]),
  orgName: z.string().optional(),
  licenseNo: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);

export default router;
