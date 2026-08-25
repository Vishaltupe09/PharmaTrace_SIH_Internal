import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { initiateCustodyTransfer, confirmCustodyReceipt } from "../services/custodyService";
import { prisma } from "../utils/prisma";

export async function handleTransferCustody(req: AuthenticatedRequest, res: Response) {
  try {
    const { batchId, fromEntityId, toEntityId } = req.body;

    const result = await initiateCustodyTransfer({
      batchId,
      fromEntityId,
      toEntityId,
      actorUserId: req.user!.userId,
    });

    return res.status(200).json({
      message: "Custody transfer initiated successfully",
      ...result,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
}

export async function handleConfirmReceipt(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const result = await confirmCustodyReceipt({
      shipmentId: id,
      actorUserId: req.user!.userId,
    });

    return res.status(200).json({
      message: "Custody receipt confirmed successfully",
      ...result,
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  }
}

export async function getShipments(req: AuthenticatedRequest, res: Response) {
  try {
    const shipments = await prisma.shipment.findMany({
      orderBy: { initiatedAt: "desc" },
      include: {
        batch: {
          include: { medicine: true },
        },
      },
    });

    return res.json({ shipments });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
