import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding PharmaTrace database...");

  const passwordHash = await bcrypt.hash("AdminPassword123!", 10);

  // 1. Admin User
  const admin = await prisma.user.upsert({
    where: { email: "admin@pharmatrace.com" },
    update: {},
    create: {
      email: "admin@pharmatrace.com",
      passwordHash,
      role: "ADMIN",
      status: "APPROVED",
      walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    },
  });
  console.log("Seeded Admin user:", admin.email);

  // 2. Sample Medicine
  const medicine = await prisma.medicine.create({
    data: {
      name: "Deferasirox 500mg Tablets",
      genericName: "Deferasirox",
      brandName: "ThalassemiCure",
      dosageForm: "Oral Dispersible Tablet",
      strength: "500mg",
      storageRequirements: "Store below 30°C in dry place, protect from moisture",
    },
  });
  console.log("Seeded sample medicine:", medicine.name);

  console.log("Database seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
