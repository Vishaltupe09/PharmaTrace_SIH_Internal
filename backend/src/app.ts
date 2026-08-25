import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import batchRoutes from "./routes/batchRoutes";
import shipmentRoutes from "./routes/shipmentRoutes";
import verifyRoutes from "./routes/verifyRoutes";
import medicineRoutes from "./routes/medicineRoutes";
import entityRoutes from "./routes/entityRoutes";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

// Rate limiting for auth endpoints (login / register) — PRD §17
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: "Too many authentication requests. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
app.use("/api/auth", authRateLimiter, authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/manufacturers/batches", batchRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/entities", entityRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

export default app;
