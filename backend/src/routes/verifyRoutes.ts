import { Router } from "express";
import { handleScanQr } from "../controllers/verifyController";
import rateLimit from "express-rate-limit";

const router = Router();

// Rate limiting on verification endpoint (100 scans per 15 minutes per IP)
const scanRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Rate limit exceeded for QR verification scans" },
});

router.post("/scan", scanRateLimiter, handleScanQr);

export default router;
