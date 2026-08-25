import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

declare const process: any;

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding PharmaTrace database...");

  // 1. Admin User (upsert — idempotent)
  const passwordHash = await bcrypt.hash("AdminPassword123!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@pharmatrace.com" },
    update: {
      passwordHash,
      status: "APPROVED",
      walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    },
    create: {
      email: "admin@pharmatrace.com",
      passwordHash,
      role: "ADMIN",
      status: "APPROVED",
      walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    },
  });
  console.log("Seeded Admin user:", admin.email);

  // 2. Sample Medicines (upsert — idempotent)
  const medicine1 = await prisma.medicine.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {
      name: "Deferasirox 500mg Tablets",
      genericName: "Deferasirox",
      brandName: "ThalassemiCure",
      dosageForm: "Oral Dispersible Tablet",
      strength: "500mg",
      storageRequirements: "Store below 30°C in dry place, protect from moisture",
    },
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Deferasirox 500mg Tablets",
      genericName: "Deferasirox",
      brandName: "ThalassemiCure",
      dosageForm: "Oral Dispersible Tablet",
      strength: "500mg",
      storageRequirements: "Store below 30°C in dry place, protect from moisture",
    },
  });
  console.log("Seeded sample medicine:", medicine1.name);

  const medicine2 = await prisma.medicine.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {
      name: "Hydroxyurea 500mg Capsules",
      genericName: "Hydroxyurea",
      brandName: "HydroCell",
      dosageForm: "Hard Capsule",
      strength: "500mg",
      storageRequirements: "Store at room temperature 15–30°C, away from light",
    },
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Hydroxyurea 500mg Capsules",
      genericName: "Hydroxyurea",
      brandName: "HydroCell",
      dosageForm: "Hard Capsule",
      strength: "500mg",
      storageRequirements: "Store at room temperature 15–30°C, away from light",
    },
  });
  console.log("Seeded sample medicine:", medicine2.name);

  // 3. Demo Manufacturer (upsert — idempotent)
  const mfrHash = await bcrypt.hash("Manufacturer123!", 10);
  const mfrWallet = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const mfrUser = await prisma.user.upsert({
    where: { email: "manufacturer@pharmatrace.com" },
    update: { passwordHash: mfrHash, status: "APPROVED", walletAddress: mfrWallet },
    create: {
      email: "manufacturer@pharmatrace.com",
      passwordHash: mfrHash,
      role: "MANUFACTURER",
      status: "APPROVED",
      walletAddress: mfrWallet,
    },
  });
  const existingMfr = await prisma.manufacturer.findFirst({
    where: { OR: [{ userId: mfrUser.id }, { licenseNo: "MFR-DEMO-001" }, { walletAddress: mfrWallet }] },
  });
  if (existingMfr) {
    await prisma.manufacturer.update({
      where: { id: existingMfr.id },
      data: { userId: mfrUser.id, orgName: "ThalassemiCure Pharma Ltd.", licenseNo: "MFR-DEMO-001", walletAddress: mfrWallet, approvedAt: new Date() },
    });
  } else {
    await prisma.manufacturer.create({
      data: { userId: mfrUser.id, orgName: "ThalassemiCure Pharma Ltd.", licenseNo: "MFR-DEMO-001", walletAddress: mfrWallet, approvedAt: new Date() },
    });
  }
  console.log("Seeded demo Manufacturer:", mfrUser.email);

  // 4. Demo Distributor
  const distHash = await bcrypt.hash("Distributor123!", 10);
  const distWallet = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
  const distUser = await prisma.user.upsert({
    where: { email: "distributor@pharmatrace.com" },
    update: { passwordHash: distHash, status: "APPROVED", walletAddress: distWallet },
    create: {
      email: "distributor@pharmatrace.com",
      passwordHash: distHash,
      role: "DISTRIBUTOR",
      status: "APPROVED",
      walletAddress: distWallet,
    },
  });
  const existingDist = await prisma.distributor.findFirst({
    where: { OR: [{ userId: distUser.id }, { licenseNo: "DIST-DEMO-001" }, { walletAddress: distWallet }] },
  });
  if (existingDist) {
    await prisma.distributor.update({
      where: { id: existingDist.id },
      data: { userId: distUser.id, orgName: "MedSupply Distributors Pvt. Ltd.", licenseNo: "DIST-DEMO-001", walletAddress: distWallet, approvedAt: new Date() },
    });
  } else {
    await prisma.distributor.create({
      data: { userId: distUser.id, orgName: "MedSupply Distributors Pvt. Ltd.", licenseNo: "DIST-DEMO-001", walletAddress: distWallet, approvedAt: new Date() },
    });
  }
  console.log("Seeded demo Distributor:", distUser.email);

  // 5. Demo Wholesaler
  const wsHash = await bcrypt.hash("Wholesaler123!", 10);
  const wsWallet = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";
  const wsUser = await prisma.user.upsert({
    where: { email: "wholesaler@pharmatrace.com" },
    update: { passwordHash: wsHash, status: "APPROVED", walletAddress: wsWallet },
    create: {
      email: "wholesaler@pharmatrace.com",
      passwordHash: wsHash,
      role: "WHOLESALER",
      status: "APPROVED",
      walletAddress: wsWallet,
    },
  });
  const existingWs = await prisma.wholesaler.findFirst({
    where: { OR: [{ userId: wsUser.id }, { licenseNo: "WS-DEMO-001" }, { walletAddress: wsWallet }] },
  });
  if (existingWs) {
    await prisma.wholesaler.update({
      where: { id: existingWs.id },
      data: { userId: wsUser.id, orgName: "PharmaWholesale India Ltd.", licenseNo: "WS-DEMO-001", walletAddress: wsWallet, approvedAt: new Date() },
    });
  } else {
    await prisma.wholesaler.create({
      data: { userId: wsUser.id, orgName: "PharmaWholesale India Ltd.", licenseNo: "WS-DEMO-001", walletAddress: wsWallet, approvedAt: new Date() },
    });
  }
  console.log("Seeded demo Wholesaler:", wsUser.email);

  // 6. Demo Pharmacy
  const phHash = await bcrypt.hash("Pharmacy123!", 10);
  const phWallet = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65";
  const phUser = await prisma.user.upsert({
    where: { email: "pharmacy@pharmatrace.com" },
    update: { passwordHash: phHash, status: "APPROVED", walletAddress: phWallet },
    create: {
      email: "pharmacy@pharmatrace.com",
      passwordHash: phHash,
      role: "PHARMACY",
      status: "APPROVED",
      walletAddress: phWallet,
    },
  });
  const existingPh = await prisma.pharmacy.findFirst({
    where: { OR: [{ userId: phUser.id }, { licenseNo: "PH-DEMO-001" }, { walletAddress: phWallet }] },
  });
  if (existingPh) {
    await prisma.pharmacy.update({
      where: { id: existingPh.id },
      data: { userId: phUser.id, orgName: "City Care Pharmacy", licenseNo: "PH-DEMO-001", walletAddress: phWallet, approvedAt: new Date() },
    });
  } else {
    await prisma.pharmacy.create({
      data: { userId: phUser.id, orgName: "City Care Pharmacy", licenseNo: "PH-DEMO-001", walletAddress: phWallet, approvedAt: new Date() },
    });
  }
  console.log("Seeded demo Pharmacy:", phUser.email);

  // 7. Demo Inspector
  const insHash = await bcrypt.hash("Inspector123!", 10);
  await prisma.user.upsert({
    where: { email: "inspector@pharmatrace.com" },
    update: {
      passwordHash: insHash,
      status: "APPROVED",
    },
    create: {
      email: "inspector@pharmatrace.com",
      passwordHash: insHash,
      role: "INSPECTOR",
      status: "APPROVED",
    },
  });
  console.log("Seeded demo Inspector: inspector@pharmatrace.com");

  console.log("\n✅ Database seeding completed successfully.");
  console.log("\nDemo credentials:");
  console.log("  Admin:        admin@pharmatrace.com        / AdminPassword123!");
  console.log("  Manufacturer: manufacturer@pharmatrace.com / Manufacturer123!");
  console.log("  Distributor:  distributor@pharmatrace.com  / Distributor123!");
  console.log("  Wholesaler:   wholesaler@pharmatrace.com   / Wholesaler123!");
  console.log("  Pharmacy:     pharmacy@pharmatrace.com     / Pharmacy123!");
  console.log("  Inspector:    inspector@pharmatrace.com    / Inspector123!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
