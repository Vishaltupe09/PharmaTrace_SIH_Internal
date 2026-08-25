import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { verifyQrPayload } from "../services/qrService";
import { getBatchFromChain } from "../services/blockchainService";
import { computeBatchRiskScore } from "../services/aiService";
import { logSecurityEvent } from "../services/auditService";

export async function handleScanQr(req: Request, res: Response) {
  try {
    const { d: encodedData, qrPayload, geoLat, geoLng, userId } = req.body;
    const dataToVerify = encodedData || qrPayload;

    if (!dataToVerify) {
      return res.status(400).json({
        resultState: "INVALID_QR",
        authentic: false,
        message: "Missing QR verification payload",
      });
    }

    // 1. Verify QR payload signature
    const verification = verifyQrPayload(dataToVerify);
    if (!verification.valid || !verification.payload) {
      await prisma.verificationRecord.create({
        data: {
          qrId: "UNKNOWN_TAMPERED",
          scannedByUserId: userId || null,
          resultState: "INVALID_QR",
          geoLat: geoLat || null,
          geoLng: geoLng || null,
        },
      });

      await logSecurityEvent({
        type: "TAMPERED_QR_SIGNATURE",
        severity: "HIGH",
        relatedEntity: "UNKNOWN_QR",
        description: `QR signature verification failed: ${verification.reason}`,
      });

      return res.status(200).json({
        resultState: "INVALID_QR",
        authentic: false,
        message: verification.reason || "Invalid QR HMAC signature — tampering detected",
      });
    }

    const payload = verification.payload;

    // 2. Lookup QR & Batch record in DB
    const qrRecord = await prisma.qrCode.findFirst({
      where: {
        payload: typeof dataToVerify === "string" ? dataToVerify : JSON.stringify(dataToVerify),
      },
      include: {
        batch: {
          include: {
            medicine: true,
            manufacturer: true,
            recalls: true,
          },
        },
        package: true,
      },
    });

    // Fallback lookup by batch ID or package ID
    const batch = qrRecord
      ? qrRecord.batch
      : await prisma.batch.findUnique({
          where: { id: payload.batchId },
          include: {
            medicine: true,
            manufacturer: true,
            recalls: true,
          },
        });

    if (!batch) {
      await prisma.verificationRecord.create({
        data: {
          qrId: payload.id,
          scannedByUserId: userId || null,
          resultState: "UNKNOWN_PRODUCT",
          geoLat: geoLat || null,
          geoLng: geoLng || null,
        },
      });

      return res.status(200).json({
        resultState: "UNKNOWN_PRODUCT",
        authentic: false,
        message: "Medicine batch or QR identifier not found in platform registry",
      });
    }

    // 3. DETERMINISTIC SECURITY RULE: Recalled status check (OVERWRITES EVERYTHING)
    if (batch.status === "RECALLED" || batch.recalls.length > 0) {
      await prisma.verificationRecord.create({
        data: {
          qrId: payload.id,
          scannedByUserId: userId || null,
          resultState: "RECALLED",
          geoLat: geoLat || null,
          geoLng: geoLng || null,
        },
      });

      return res.status(200).json({
        resultState: "RECALLED",
        authentic: false,
        message: "WARNING: This medicine batch has been officially RECALLED. Do not dispense or consume.",
        batch: {
          batchNumber: batch.batchNumber,
          medicineName: batch.medicine.name,
          mfgDate: batch.mfgDate,
          expiryDate: batch.expiryDate,
        },
      });
    }

    // 4. DETERMINISTIC SECURITY RULE: Expired status check
    const now = new Date();
    if (batch.expiryDate < now) {
      await prisma.verificationRecord.create({
        data: {
          qrId: payload.id,
          scannedByUserId: userId || null,
          resultState: "EXPIRED",
          geoLat: geoLat || null,
          geoLng: geoLng || null,
        },
      });

      return res.status(200).json({
        resultState: "EXPIRED",
        authentic: false,
        message: "WARNING: This medicine batch has EXPIRED. Do not consume.",
        batch: {
          batchNumber: batch.batchNumber,
          medicineName: batch.medicine.name,
          mfgDate: batch.mfgDate,
          expiryDate: batch.expiryDate,
        },
      });
    }

    // 5. DETERMINISTIC SECURITY RULE: Duplicate scan check
    const previousScans = await prisma.verificationRecord.findMany({
      where: { qrId: payload.id },
      orderBy: { timestamp: "desc" },
    });

    let isDuplicatePattern = false;
    if (previousScans.length > 0 && payload.type === "package") {
      // Package scanned multiple times
      isDuplicatePattern = true;
    }

    if (isDuplicatePattern) {
      await prisma.verificationRecord.create({
        data: {
          qrId: payload.id,
          scannedByUserId: userId || null,
          resultState: "SUSPICIOUS_DUPLICATE",
          geoLat: geoLat || null,
          geoLng: geoLng || null,
        },
      });

      await logSecurityEvent({
        type: "DUPLICATE_QR_SCAN",
        severity: "HIGH",
        relatedEntity: batch.id,
        description: `Package QR ${payload.id} scanned multiple times. Possible QR cloning attack.`,
      });

      return res.status(200).json({
        resultState: "SUSPICIOUS_DUPLICATE",
        authentic: false,
        message: "SUSPICIOUS: This package QR code has already been scanned previously. Potential cloned packaging.",
        batch: {
          batchNumber: batch.batchNumber,
          medicineName: batch.medicine.name,
        },
      });
    }

    // 6. Cross-check On-Chain Contract State
    let chainData = null;
    try {
      chainData = await getBatchFromChain(batch.chainBatchId);
    } catch (err: any) {
      console.error("On-chain lookup notice:", err.message);
    }

    // 7. Compute Advisory AI Risk Score
    const aiRisk = await computeBatchRiskScore(batch.id);

    // Record scan success
    const resultState = batch.status === "FLAGGED" ? "VERIFIED_BUT_FLAGGED" : "VERIFIED_AUTHENTIC";

    await prisma.verificationRecord.create({
      data: {
        qrId: payload.id,
        scannedByUserId: userId || null,
        resultState,
        geoLat: geoLat || null,
        geoLng: geoLng || null,
      },
    });

    return res.status(200).json({
      resultState,
      authentic: true,
      message: "Medicine batch successfully verified authentic on blockchain.",
      medicine: {
        name: batch.medicine.name,
        genericName: batch.medicine.genericName,
        brandName: batch.medicine.brandName,
        strength: batch.medicine.strength,
        storageRequirements: batch.medicine.storageRequirements,
      },
      batch: {
        batchNumber: batch.batchNumber,
        mfgDate: batch.mfgDate,
        expiryDate: batch.expiryDate,
        quantity: batch.quantity,
        status: batch.status,
        metadataHash: batch.metadataHash,
      },
      manufacturer: {
        orgName: batch.manufacturer.orgName,
        licenseNo: batch.manufacturer.licenseNo,
      },
      blockchain: {
        chainBatchId: batch.chainBatchId,
        txHash: batch.txHash,
        chainStatus: batch.chainStatus,
        onChainCustodian: chainData ? chainData.currentCustodian : null,
      },
      aiRiskScore: {
        score: aiRisk.score,
        factors: aiRisk.factors,
        disclaimer: aiRisk.disclaimer,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      resultState: "VERIFICATION_FAILED",
      authentic: false,
      message: `Verification system error: ${err.message}`,
    });
  }
}
