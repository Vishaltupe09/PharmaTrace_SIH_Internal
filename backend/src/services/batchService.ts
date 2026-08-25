import crypto from "crypto";
import { prisma } from "../utils/prisma";
import { registerBatchOnChain, getContract, defaultSigner } from "./blockchainService";
import { generateQrPayload, renderQrCodeDataUrl } from "./qrService";
import { logAuditEntry } from "./auditService";

export interface CreateBatchInput {
  medicineId: string;
  manufacturerId: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  quantity: number;
  packageCount?: number;
}

export function computeMetadataHash(data: {
  medicineName: string;
  brandName: string;
  dosageForm: string;
  strength: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
}): string {
  const canonical = `${data.medicineName}|${data.brandName}|${data.dosageForm}|${data.strength}|${data.batchNumber}|${data.mfgDate}|${data.expiryDate}`;
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

export async function createBatch(input: CreateBatchInput, actorUserId: string) {
  // Check duplicate batch number
  const existing = await prisma.batch.findUnique({
    where: { batchNumber: input.batchNumber },
  });
  if (existing) {
    const error: any = new Error(`Batch number '${input.batchNumber}' already exists.`);
    error.statusCode = 409;
    throw error;
  }

  const medicine = await prisma.medicine.findUnique({
    where: { id: input.medicineId },
  });
  if (!medicine) {
    const error: any = new Error("Medicine record not found.");
    error.statusCode = 404;
    throw error;
  }

  const manufacturer = await prisma.manufacturer.findUnique({
    where: { id: input.manufacturerId },
  });
  if (!manufacturer) {
    const error: any = new Error("Manufacturer entity not found.");
    error.statusCode = 404;
    throw error;
  }

  const metadataHash = computeMetadataHash({
    medicineName: medicine.name,
    brandName: medicine.brandName,
    dosageForm: medicine.dosageForm,
    strength: medicine.strength,
    batchNumber: input.batchNumber,
    mfgDate: input.mfgDate,
    expiryDate: input.expiryDate,
  });

  const chainBatchId = input.batchNumber;

  // Create DB record with chainStatus PENDING
  const batch = await prisma.batch.create({
    data: {
      medicineId: input.medicineId,
      manufacturerId: input.manufacturerId,
      batchNumber: input.batchNumber,
      mfgDate: new Date(input.mfgDate),
      expiryDate: new Date(input.expiryDate),
      quantity: input.quantity,
      status: "CREATED",
      metadataHash: metadataHash,
      chainBatchId: chainBatchId,
      chainStatus: "PENDING",
    },
  });

  // Generate Batch-Level QR Code
  const { payload: batchPayload, signature: batchSig, encodedData: batchEncoded } = generateQrPayload(
    batch.id,
    "batch",
    batch.id
  );

  const batchQrDataUrl = await renderQrCodeDataUrl(batchEncoded);

  const qrRecord = await prisma.qrCode.create({
    data: {
      batchId: batch.id,
      payload: batchEncoded,
      signature: batchSig,
    },
  });

  // Optional Package-Level QR Generation (Phase B requirement)
  const packageCount = input.packageCount || 0;
  const packageQrs = [];

  for (let i = 1; i <= packageCount; i++) {
    const pkgQrId = `PKG-${batch.batchNumber}-${String(i).padStart(4, "0")}`;
    const pkg = await prisma.package.create({
      data: {
        batchId: batch.id,
        packageQrId: pkgQrId,
      },
    });

    const { signature: pkgSig, encodedData: pkgEncoded } = generateQrPayload(
      pkg.id,
      "package",
      batch.id
    );

    const pkgQrDataUrl = await renderQrCodeDataUrl(pkgEncoded);

    await prisma.qrCode.create({
      data: {
        batchId: batch.id,
        packageId: pkg.id,
        payload: pkgEncoded,
        signature: pkgSig,
      },
    });

    packageQrs.push({
      packageId: pkg.id,
      packageQrId: pkgQrId,
      encodedData: pkgEncoded,
      qrCodeUrl: pkgQrDataUrl,
    });
  }

  // Submit transaction on-chain
  let txHash = "";
  try {
    txHash = await registerBatchOnChain(chainBatchId, metadataHash);

    await prisma.batch.update({
      where: { id: batch.id },
      data: {
        txHash: txHash,
        chainStatus: "CONFIRMED",
      },
    });
  } catch (err: any) {
    await prisma.batch.update({
      where: { id: batch.id },
      data: { chainStatus: "FAILED" },
    });
    console.error("Smart contract registration failed:", err.message);
  }

  await logAuditEntry({
    actorUserId,
    action: "BATCH_REGISTERED",
    entityType: "BATCH",
    entityId: batch.id,
    txHash: txHash || undefined,
  });

  return {
    batch,
    batchQr: {
      qrId: qrRecord.id,
      encodedData: batchEncoded,
      qrCodeUrl: batchQrDataUrl,
    },
    packages: packageQrs,
    txHash,
  };
}
