import { Router } from "express";
import {
  approveUser,
  rejectUser,
  getPendingUsers,
  triggerAiScoreRecomputation,
  getAuditLogs,
  getSecurityEvents,
  getRecalls,
  getNotifications,
} from "../controllers/adminController";
import { authenticate, authorize } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/users/pending", getPendingUsers);
router.post("/users/:userId/approve", approveUser);
router.post("/users/:userId/reject", rejectUser);
router.post("/ai/recompute-scores", triggerAiScoreRecomputation);
router.get("/audit-logs", getAuditLogs);
router.get("/security-events", getSecurityEvents);

// Recall management — GET /api/admin/recalls
router.get("/recalls", getRecalls);

// In-app notifications center — GET /api/admin/notifications
router.get("/notifications", getNotifications);

export default router;
