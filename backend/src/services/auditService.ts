import { prisma } from "../utils/prisma";

export async function logAuditEntry(params: {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  txHash?: string;
}) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorUserId: params.actorUserId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        txHash: params.txHash || null,
      },
    });
  } catch (err: any) {
    console.error("Failed to record audit log:", err);
  }
}

export async function logSecurityEvent(params: {
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  relatedEntity: string;
  description: string;
}) {
  try {
    return await prisma.securityEvent.create({
      data: {
        type: params.type,
        severity: params.severity,
        relatedEntity: params.relatedEntity,
        description: params.description,
      },
    });
  } catch (err: any) {
    console.error("Failed to record security event:", err);
  }
}
