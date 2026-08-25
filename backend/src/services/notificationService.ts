/**
 * notificationService.ts
 * In-app notification service (MVP: stored in security_events + audit_logs).
 * Handles severity-tiered alerts per PRD §25.
 * Does NOT send external email/SMS (future scope per PRD §25).
 */

import { prisma } from "../utils/prisma";
import { logSecurityEvent } from "./auditService";

export type NotificationSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface NotificationPayload {
  type: string;
  severity: NotificationSeverity;
  relatedEntity: string;
  description: string;
}

/**
 * Emit a platform notification as a SecurityEvent.
 * Severity levels per PRD §25:
 *  LOW    — expiry approaching
 *  MEDIUM — high AI risk score, repeated failed verifications
 *  HIGH   — suspicious medicine, duplicate QR, unauthorized transfer attempt
 *  CRITICAL — recall initiated, security-breach attempt
 */
export async function emitNotification(payload: NotificationPayload): Promise<void> {
  await logSecurityEvent({
    type: payload.type,
    severity: payload.severity,
    relatedEntity: payload.relatedEntity,
    description: payload.description,
  });
}

/**
 * Fan-out recall notification to all entities that ever held the recalled batch.
 * Emits one CRITICAL notification plus one per historical custodian.
 * Per PRD §O (Recall workflow) and §25.
 */
export async function notifyRecall(batchId: string, batchNumber: string, reason: string): Promise<void> {
  // Emit platform-level CRITICAL security event
  await emitNotification({
    type: "BATCH_RECALLED",
    severity: "CRITICAL",
    relatedEntity: batchId,
    description: `RECALL ALERT: Batch ${batchNumber} has been officially recalled. Reason: ${reason}`,
  });

  // Retrieve all past custody holders for targeted notification
  const transfers = await prisma.custodyTransfer.findMany({
    where: { batchId },
    orderBy: { timestamp: "asc" },
  });

  for (const transfer of transfers) {
    await emitNotification({
      type: "RECALL_CUSTODY_ALERT",
      severity: "CRITICAL",
      relatedEntity: batchId,
      description: `Recall notice for batch ${batchNumber}: past custodian at address ${transfer.toAddress} must be informed. Reason: ${reason}`,
    });
  }
}

/**
 * Notify when a duplicate QR scan is detected.
 * Per PRD §Q (Duplicate QR Detection) and §25.
 */
export async function notifyDuplicateScan(batchId: string, qrId: string): Promise<void> {
  await emitNotification({
    type: "DUPLICATE_QR_SCAN",
    severity: "HIGH",
    relatedEntity: batchId,
    description: `Suspicious duplicate scan detected for QR identifier ${qrId}. Possible QR cloning attack.`,
  });
}

/**
 * Notify when an unauthorized transfer is attempted.
 * Per PRD §R and §25.
 */
export async function notifyUnauthorizedTransfer(batchId: string, attemptedBy: string): Promise<void> {
  await emitNotification({
    type: "UNAUTHORIZED_TRANSFER_ATTEMPT",
    severity: "HIGH",
    relatedEntity: batchId,
    description: `Unauthorized custody transfer attempt on batch ${batchId} by ${attemptedBy}.`,
  });
}

/**
 * Notify when AI risk score exceeds the HIGH threshold (>60).
 * Per PRD §25.
 */
export async function notifyHighRiskScore(batchId: string, score: number): Promise<void> {
  await emitNotification({
    type: "HIGH_AI_RISK_SCORE",
    severity: "MEDIUM",
    relatedEntity: batchId,
    description: `AI advisory risk score for batch ${batchId} has reached ${score}/100 (HIGH band). Investigation recommended.`,
  });
}

/**
 * Notify when a batch is approaching expiry (≤ 30 days).
 * Per PRD §25.
 */
export async function notifyExpiryApproaching(batchId: string, batchNumber: string, daysToExpiry: number): Promise<void> {
  await emitNotification({
    type: "EXPIRY_APPROACHING",
    severity: "LOW",
    relatedEntity: batchId,
    description: `Batch ${batchNumber} expires in ${daysToExpiry} day(s). Please review inventory.`,
  });
}

/**
 * Get recent notifications (security events) for the in-app notification center.
 * Ordered newest-first. Accepts optional severity filter.
 */
export async function getRecentNotifications(limit = 50, severity?: NotificationSeverity) {
  return prisma.securityEvent.findMany({
    where: severity ? { severity } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
