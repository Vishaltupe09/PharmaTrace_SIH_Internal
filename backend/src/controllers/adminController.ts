import { Response } from "express";
import { getRecentNotifications } from "../services/notificationService";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { prisma } from "../utils/prisma";
import { generateWallet, grantEntityRole } from "../services/blockchainService";
import { recomputePlatformRiskScores } from "../services/aiService";
import { logAuditEntry } from "../services/auditService";

export async function approveUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        manufacturer: true,
        distributor: true,
        wholesaler: true,
        pharmacy: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.status === "APPROVED") {
      return res.status(400).json({ error: "User is already approved" });
    }

    // Generate backend-custodied wallet address if not already assigned
    let walletAddress = user.walletAddress;
    if (!walletAddress) {
      const wallet = generateWallet();
      walletAddress = wallet.address;
    }

    // Grant smart contract role on-chain if user has a business role
    let txHash: string | null = null;
    if (["MANUFACTURER", "DISTRIBUTOR", "WHOLESALER", "PHARMACY"].includes(user.role)) {
      try {
        txHash = await grantEntityRole(walletAddress, user.role);
      } catch (err: any) {
        console.error(`Warning: On-chain role grant failed for ${user.email}:`, err.message);
      }
    }

    // Persist wallet address and approved status to User and entity profiles
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: "APPROVED",
        walletAddress: walletAddress,
      },
    });

    const now = new Date();
    if (user.manufacturer) {
      await prisma.manufacturer.update({
        where: { id: user.manufacturer.id },
        data: { walletAddress, approvedAt: now },
      });
    } else if (user.distributor) {
      await prisma.distributor.update({
        where: { id: user.distributor.id },
        data: { walletAddress, approvedAt: now },
      });
    } else if (user.wholesaler) {
      await prisma.wholesaler.update({
        where: { id: user.wholesaler.id },
        data: { walletAddress, approvedAt: now },
      });
    } else if (user.pharmacy) {
      await prisma.pharmacy.update({
        where: { id: user.pharmacy.id },
        data: { walletAddress, approvedAt: now },
      });
    }

    await logAuditEntry({
      actorUserId: req.user!.userId,
      action: "ADMIN_APPROVED_USER",
      entityType: "USER",
      entityId: userId,
      txHash: txHash || undefined,
    });

    return res.json({
      message: `User ${user.email} successfully approved`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        walletAddress: updatedUser.walletAddress,
      },
      txHash,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function rejectUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { userId } = req.params;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: "REJECTED" },
    });

    await logAuditEntry({
      actorUserId: req.user!.userId,
      action: "ADMIN_REJECTED_USER",
      entityType: "USER",
      entityId: userId,
    });

    return res.json({ message: `User ${user.email} rejected`, user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getPendingUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const users = await prisma.user.findMany({
      where: { status: "PENDING" },
      include: {
        manufacturer: true,
        distributor: true,
        wholesaler: true,
        pharmacy: true,
      },
    });

    return res.json({ users });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function triggerAiScoreRecomputation(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await recomputePlatformRiskScores();

    await logAuditEntry({
      actorUserId: req.user!.userId,
      action: "AI_RISK_SCORES_RECOMPUTED",
      entityType: "PLATFORM",
      entityId: "SYSTEM",
    });

    return res.json({
      message: "Platform-wide AI risk scores recomputed successfully",
      computedCount: result.computedCount,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getAuditLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 100,
      include: { actor: { select: { email: true, role: true } } },
    });
    return res.json({ logs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getSecurityEvents(req: AuthenticatedRequest, res: Response) {
  try {
    const events = await prisma.securityEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return res.json({ events });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getRecalls(req: AuthenticatedRequest, res: Response) {
  try {
    const recalls = await prisma.recall.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        batch: {
          include: {
            medicine: {
              select: { name: true, brandName: true, genericName: true },
            },
            manufacturer: {
              select: { orgName: true, licenseNo: true },
            },
          },
        },
      },
    });
    return res.json({ recalls });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    const limit = parseInt((req.query.limit as string) || "50", 10);
    const severity = req.query.severity as any;
    const notifications = await getRecentNotifications(limit, severity);
    return res.json({ notifications });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
