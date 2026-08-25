/**
 * entityController.ts
 * Provides read-only lookup of approved business entities (Distributor, Wholesaler, Pharmacy)
 * so that transfer-modal dropdowns in the frontend can be populated.
 * Per PRD §G–J (custody transfer workflow) — recipient must be an approved, correctly-roled account.
 */

import { Request, Response } from "express";
import { prisma } from "../utils/prisma";

/**
 * GET /api/entities?role=DISTRIBUTOR|WHOLESALER|PHARMACY
 * Returns approved entities for the given role.
 * Only returns public-facing fields (id, orgName, licenseNo, walletAddress).
 * No PII is exposed.
 */
export async function getEntitiesByRole(req: Request, res: Response) {
  try {
    const role = (req.query.role as string)?.toUpperCase();

    if (!role || !["DISTRIBUTOR", "WHOLESALER", "PHARMACY"].includes(role)) {
      return res.status(400).json({
        error: "Query param 'role' is required and must be one of: DISTRIBUTOR, WHOLESALER, PHARMACY",
      });
    }

    let entities: any[] = [];

    if (role === "DISTRIBUTOR") {
      entities = await prisma.distributor.findMany({
        where: { walletAddress: { not: null } }, // Only approved (wallet assigned on approval)
        select: {
          id: true,
          orgName: true,
          licenseNo: true,
          walletAddress: true,
        },
        orderBy: { orgName: "asc" },
      });
    } else if (role === "WHOLESALER") {
      entities = await prisma.wholesaler.findMany({
        where: { walletAddress: { not: null } },
        select: {
          id: true,
          orgName: true,
          licenseNo: true,
          walletAddress: true,
        },
        orderBy: { orgName: "asc" },
      });
    } else if (role === "PHARMACY") {
      entities = await prisma.pharmacy.findMany({
        where: { walletAddress: { not: null } },
        select: {
          id: true,
          orgName: true,
          licenseNo: true,
          walletAddress: true,
        },
        orderBy: { orgName: "asc" },
      });
    }

    return res.json({ entities, role });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/entities/me
 * Returns the authenticated user's own entity profile (for dashboard display).
 */
export async function getMyEntity(req: any, res: Response) {
  try {
    const { userId, role } = req.user;

    let entity = null;

    switch (role) {
      case "MANUFACTURER":
        entity = await prisma.manufacturer.findUnique({ where: { userId } });
        break;
      case "DISTRIBUTOR":
        entity = await prisma.distributor.findUnique({ where: { userId } });
        break;
      case "WHOLESALER":
        entity = await prisma.wholesaler.findUnique({ where: { userId } });
        break;
      case "PHARMACY":
        entity = await prisma.pharmacy.findUnique({ where: { userId } });
        break;
      default:
        return res.json({ entity: null });
    }

    return res.json({ entity });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
