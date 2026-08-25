import { prisma } from "../utils/prisma";

export interface RiskFactor {
  factor: string;
  weight: number;
  description: string;
}

export interface RiskScoreResult {
  score: number;
  factors: RiskFactor[];
  disclaimer: string;
}

const ADVISORY_DISCLAIMER =
  "Risk Score is an AI-generated advisory indicator based on behavioral patterns. It is not proof that a medicine is physically counterfeit.";

export async function computeBatchRiskScore(batchId: string): Promise<RiskScoreResult> {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      qrCodes: true,
      shipments: true,
      recalls: true,
    },
  });

  if (!batch) {
    return {
      score: 0,
      factors: [],
      disclaimer: ADVISORY_DISCLAIMER,
    };
  }

  let totalScore = 0;
  const factors: RiskFactor[] = [];

  // 1. Check for Recalled status
  if (batch.status === "RECALLED" || batch.recalls.length > 0) {
    totalScore += 100;
    factors.push({
      factor: "RECALL_ACTIVE",
      weight: 100,
      description: "Batch has been officially recalled by Manufacturer or System Admin.",
    });
  }

  // 2. Check Expiry Proximity
  const now = new Date();
  const daysToExpiry = Math.ceil((batch.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysToExpiry <= 0) {
    totalScore += 50;
    factors.push({
      factor: "EXPIRED_MEDICINE",
      weight: 50,
      description: "Batch is past its expiration date.",
    });
  } else if (daysToExpiry <= 30) {
    totalScore += 20;
    factors.push({
      factor: "NEAR_EXPIRY",
      weight: 20,
      description: `Batch expires in ${daysToExpiry} days.`,
    });
  }

  // 3. Scan Verification History & Duplicate Scans
  const qrIds = batch.qrCodes.map((q) => q.id);
  if (qrIds.length > 0) {
    const scanRecords = await prisma.verificationRecord.findMany({
      where: { qrId: { in: qrIds } },
    });

    const suspiciousScans = scanRecords.filter((r) => r.resultState === "SUSPICIOUS_DUPLICATE");
    const invalidScans = scanRecords.filter((r) => r.resultState === "INVALID_QR");

    if (suspiciousScans.length > 0) {
      const weight = Math.min(60, suspiciousScans.length * 30);
      totalScore += weight;
      factors.push({
        factor: "DUPLICATE_SCAN_ATTEMPTS",
        weight,
        description: `Detected ${suspiciousScans.length} suspicious duplicate scan(s) from multiple locations.`,
      });
    }

    if (invalidScans.length > 0) {
      const weight = Math.min(30, invalidScans.length * 10);
      totalScore += weight;
      factors.push({
        factor: "INVALID_SCAN_ATTEMPTS",
        weight,
        description: `Detected ${invalidScans.length} failed/invalid scan attempt(s).`,
      });
    }
  }

  // 4. Stale Shipment Transit (> 7 days in transit)
  const staleShipments = batch.shipments.filter((s) => {
    if (s.status === "IN_TRANSIT") {
      const transitDays = Math.ceil((now.getTime() - s.initiatedAt.getTime()) / (1000 * 60 * 60 * 24));
      return transitDays > 7;
    }
    return false;
  });

  if (staleShipments.length > 0) {
    totalScore += 25;
    factors.push({
      factor: "STALE_TRANSIT",
      weight: 25,
      description: "Shipment has remained in transit for over 7 days without receipt confirmation.",
    });
  }

  // Cap score at 100
  const finalScore = Math.min(100, totalScore);

  return {
    score: finalScore,
    factors,
    disclaimer: ADVISORY_DISCLAIMER,
  };
}

export async function recomputePlatformRiskScores(): Promise<{ computedCount: number }> {
  const batches = await prisma.batch.findMany({ select: { id: true } });
  let count = 0;

  for (const b of batches) {
    const result = await computeBatchRiskScore(b.id);
    await prisma.riskScore.create({
      data: {
        batchId: b.id,
        score: result.score,
        factors: result.factors as any,
      },
    });
    count++;
  }

  return { computedCount: count };
}
