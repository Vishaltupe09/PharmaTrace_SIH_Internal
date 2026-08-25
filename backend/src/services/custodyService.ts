import { prisma } from "../utils/prisma";
import { transferCustodyOnChain, confirmReceiptOnChain } from "./blockchainService";
import { logAuditEntry, logSecurityEvent } from "./auditService";

export async function initiateCustodyTransfer(params: {
  batchId: string;
  fromEntityId: string;
  toEntityId: string;
  actorUserId: string;
}) {
  const batch = await prisma.batch.findUnique({
    where: { id: params.batchId },
    include: { manufacturer: true },
  });

  if (!batch) {
    const err: any = new Error("Batch not found");
    err.statusCode = 404;
    throw err;
  }

  if (batch.status === "RECALLED") {
    const err: any = new Error("Cannot transfer custody of a RECALLED batch");
    err.statusCode = 400;
    throw err;
  }

  // Find destination entity (Distributor, Wholesaler, or Pharmacy)
  let toWalletAddress = "";

  const dist = await prisma.distributor.findUnique({ where: { id: params.toEntityId } });
  const ws = await prisma.wholesaler.findUnique({ where: { id: params.toEntityId } });
  const ph = await prisma.pharmacy.findUnique({ where: { id: params.toEntityId } });

  if (dist) toWalletAddress = dist.walletAddress || "";
  else if (ws) toWalletAddress = ws.walletAddress || "";
  else if (ph) toWalletAddress = ph.walletAddress || "";

  if (!toWalletAddress) {
    const err: any = new Error("Recipient entity has no assigned wallet address or does not exist");
    err.statusCode = 400;
    throw err;
  }

  // Create shipment record
  const shipment = await prisma.shipment.create({
    data: {
      batchId: batch.id,
      fromEntityId: params.fromEntityId,
      toEntityId: params.toEntityId,
      status: "IN_TRANSIT",
    },
  });

  // Call on-chain
  let txHash = "";
  try {
    txHash = await transferCustodyOnChain(batch.chainBatchId, toWalletAddress);

    const updatedBatch = await prisma.batch.update({
      where: { id: batch.id },
      data: {
        status: "IN_TRANSIT",
        txHash,
        chainStatus: "CONFIRMED",
      },
    });

    await prisma.custodyTransfer.create({
      data: {
        batchId: batch.id,
        fromAddress: batch.manufacturer.walletAddress || "0x0",
        toAddress: toWalletAddress,
        txHash,
      },
    });

    await logAuditEntry({
      actorUserId: params.actorUserId,
      action: "CUSTODY_TRANSFERRED",
      entityType: "BATCH",
      entityId: batch.id,
      txHash,
    });

    return { shipment, batch: updatedBatch, txHash };
  } catch (err: any) {
    await prisma.batch.update({
      where: { id: batch.id },
      data: { chainStatus: "FAILED" },
    });

    await logSecurityEvent({
      type: "UNAUTHORIZED_TRANSFER_ATTEMPT",
      severity: "HIGH",
      relatedEntity: batch.id,
      description: `Transfer attempt failed for batch ${batch.batchNumber}: ${err.message}`,
    });

    throw err;
  }
}

export async function confirmCustodyReceipt(params: {
  shipmentId: string;
  actorUserId: string;
}) {
  const shipment = await prisma.shipment.findUnique({
    where: { id: params.shipmentId },
    include: { batch: true },
  });

  if (!shipment) {
    const err: any = new Error("Shipment not found");
    err.statusCode = 404;
    throw err;
  }

  if (shipment.batch.status === "RECALLED") {
    const err: any = new Error("Cannot confirm receipt of a RECALLED batch");
    err.statusCode = 400;
    throw err;
  }

  let txHash = "";
  try {
    txHash = await confirmReceiptOnChain(shipment.batch.chainBatchId);

    const updatedShipment = await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: "RECEIVED",
        receivedAt: new Date(),
      },
    });

    await prisma.batch.update({
      where: { id: shipment.batchId },
      data: {
        status: "RECEIVED",
        txHash,
        chainStatus: "CONFIRMED",
      },
    });

    await logAuditEntry({
      actorUserId: params.actorUserId,
      action: "RECEIPT_CONFIRMED",
      entityType: "SHIPMENT",
      entityId: shipment.id,
      txHash,
    });

    return { shipment: updatedShipment, txHash };
  } catch (err: any) {
    await prisma.batch.update({
      where: { id: shipment.batchId },
      data: { chainStatus: "FAILED" },
    });
    throw err;
  }
}
