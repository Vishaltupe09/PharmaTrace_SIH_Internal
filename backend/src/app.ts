import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";
import batchRoutes from "./routes/batchRoutes";
import shipmentRoutes from "./routes/shipmentRoutes";
import verifyRoutes from "./routes/verifyRoutes";
import medicineRoutes from "./routes/medicineRoutes";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/manufacturers/batches", batchRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/medicines", medicineRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

export default app;
