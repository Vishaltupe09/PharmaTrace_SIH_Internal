import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { prisma } from "../utils/prisma";
import { flagBatchOnChain } from "../services/blockchainService";
import { logAuditEntry, logSecurityEvent } from "../services/auditService";

export async function createMedicine(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, genericName, brandName, dosageForm, strength, storageRequirements } = req.body;

    const medicine = await prisma.medicine.create({
      data: {
        name,
        genericName,
        brandName,
        dosageForm,
        strength,
        storageRequirements,
      },
    });

    return res.status(201).json({ medicine });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getMedicines(req: AuthenticatedRequest, res: Response) {
  try {
    const medicines = await prisma.medicine.findMany({
      orderBy: { name: "asc" },
    });
    return res.json({ medicines });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/medicines/:id/flag — Pharmacy/Inspector/Admin
export async function flagMedicine(req: AuthenticatedRequest, res: Response) {
  try {
    const { id: batchId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: "Flag reason is required" });
    }

    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    if (batch.status === "RECALLED") {
      return res.status(400).json({ error: "Cannot flag a RECALLED batch — recall already active" });
    }

    // Call on-chain flagBatch
    const txHash = await flagBatchOnChain(batch.chainBatchId, reason);

    // Update DB
    await prisma.batch.update({
      where: { id: batch.id },
      data: { status: "FLAGGED", txHash, chainStatus: "CONFIRMED" },
    });

    await logAuditEntry({
      actorUserId: req.user!.userId,
      action: "BATCH_FLAGGED",
      entityType: "BATCH",
      entityId: batch.id,
      txHash,
    });

    await logSecurityEvent({
      type: "BATCH_FLAGGED_BY_USER",
      severity: "MEDIUM",
      relatedEntity: batch.id,
      description: `Batch ${batch.batchNumber} flagged by ${req.user!.email}: ${reason}`,
    });

    return res.json({
      message: `Batch ${batch.batchNumber} flagged successfully`,
      txHash,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/medicines/:id/history — returns batch + full custody timeline (DB + chain events)
export async function getBatchHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const { id: batchId } = req.params;

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        medicine: true,
        manufacturer: true,
        transfers: { orderBy: { timestamp: "asc" } },
        shipments: { orderBy: { initiatedAt: "asc" } },
        recalls: true,
        riskScores: { orderBy: { computedAt: "desc" }, take: 1 },
        qrCodes: true,
      },
    });

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    // Build merged timeline from DB records
    const timeline = [
      {
        event: "BATCH_CREATED",
        actor: batch.manufacturer.orgName,
        timestamp: batch.createdAt,
        txHash: batch.txHash,
        chainStatus: batch.chainStatus,
      },
      ...batch.transfers.map((t) => ({
        event: "CUSTODY_TRANSFERRED",
        actor: t.fromAddress,
        to: t.toAddress,
        timestamp: t.timestamp,
        txHash: t.txHash,
      })),
      ...batch.recalls.map((r) => ({
        event: "BATCH_RECALLED",
        actor: r.initiatedBy,
        reason: r.reason,
        timestamp: r.createdAt,
        txHash: r.txHash,
      })),
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return res.json({ batch, timeline });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
