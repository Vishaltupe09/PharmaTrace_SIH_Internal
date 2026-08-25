import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { prisma } from "../utils/prisma";
import { createBatch } from "../services/batchService";
import { recallBatchOnChain } from "../services/blockchainService";
import { logAuditEntry } from "../services/auditService";
import { notifyRecall } from "../services/notificationService";

export async function handleCreateBatch(req: AuthenticatedRequest, res: Response) {
  try {
    const actorUserId = req.user!.userId;

    // Find manufacturer profile for caller
    const manufacturer = await prisma.manufacturer.findUnique({
      where: { userId: actorUserId },
    });

    if (!manufacturer) {
      return res.status(403).json({ error: "Only approved manufacturers can create batches" });
    }

    const result = await createBatch(
      {
        ...req.body,
        manufacturerId: manufacturer.id,
      },
      actorUserId
    );

    return res.status(201).json(result);
  } catch (err: any) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
}

export async function getBatches(req: AuthenticatedRequest, res: Response) {
  try {
    const batches = await prisma.batch.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        medicine: true,
        manufacturer: true,
        packages: true,
        qrCodes: true,
        shipments: true,
        recalls: true,
      },
    });

    return res.json({ batches });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getBatchById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        medicine: true,
        manufacturer: true,
        packages: true,
        qrCodes: true,
        shipments: true,
        transfers: true,
        recalls: true,
        riskScores: { orderBy: { computedAt: "desc" }, take: 1 },
      },
    });

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    return res.json({ batch });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function handleRecallBatch(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: "Recall reason is required" });
    }

    const batch = await prisma.batch.findUnique({ where: { id } });
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    // Call on-chain recall
    const txHash = await recallBatchOnChain(batch.chainBatchId, reason);

    // Update DB state
    await prisma.batch.update({
      where: { id: batch.id },
      data: {
        status: "RECALLED",
        txHash,
        chainStatus: "CONFIRMED",
      },
    });

    const recall = await prisma.recall.create({
      data: {
        batchId: batch.id,
        reason,
        initiatedBy: req.user!.email,
        txHash,
      },
    });

    await logAuditEntry({
      actorUserId: req.user!.userId,
      action: "BATCH_RECALLED",
      entityType: "BATCH",
      entityId: batch.id,
      txHash,
    });

    // Fan-out recall notification to all past custodians — PRD §O
    await notifyRecall(batch.id, batch.batchNumber, reason);

    return res.json({
      message: `Batch ${batch.batchNumber} recalled successfully`,
      recall,
      txHash,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
