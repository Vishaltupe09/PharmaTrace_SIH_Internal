import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { prisma } from "../utils/prisma";

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
