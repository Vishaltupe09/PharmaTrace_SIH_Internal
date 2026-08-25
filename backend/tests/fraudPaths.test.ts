import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/utils/prisma";
import bcrypt from "bcryptjs";

describe("PharmaTrace Fraud Paths & Security Integration Test", () => {
  let adminToken: string;
  let mfrToken: string;
  let medicineId: string;
  let batchId: string;
  let packageQrPayload: string;

  beforeAll(async () => {
    // Clear test tables
    await prisma.verificationRecord.deleteMany();
    await prisma.securityEvent.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.riskScore.deleteMany();
    await prisma.recall.deleteMany();
    await prisma.custodyTransfer.deleteMany();
    await prisma.shipment.deleteMany();
    await prisma.qrCode.deleteMany();
    await prisma.package.deleteMany();
    await prisma.batch.deleteMany();
    await prisma.medicine.deleteMany();
    await prisma.manufacturer.deleteMany();
    await prisma.user.deleteMany();

    // 1. Create Admin
    const passwordHash = await bcrypt.hash("AdminPass123!", 10);
    await prisma.user.create({
      data: {
        email: "fraudadmin@pharmatrace.com",
        passwordHash,
        role: "ADMIN",
        status: "APPROVED",
        walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      },
    });

    const adminLogin = await request(app).post("/api/auth/login").send({
      email: "fraudadmin@pharmatrace.com",
      password: "AdminPass123!",
    });
    adminToken = adminLogin.body.tokens.accessToken;

    // 2. Create Manufacturer & approve
    const mfrUser = await prisma.user.create({
      data: {
        email: "fraudmfr@apex.com",
        passwordHash,
        role: "MANUFACTURER",
        status: "APPROVED",
        walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      },
    });
    await prisma.manufacturer.create({
      data: {
        userId: mfrUser.id,
        orgName: "Fraud Test Manufacturer",
        licenseNo: "LIC-FRAUD-MFR-01",
        walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        approvedAt: new Date(),
      },
    });

    const mfrLogin = await request(app).post("/api/auth/login").send({
      email: "fraudmfr@apex.com",
      password: "AdminPass123!",
    });
    mfrToken = mfrLogin.body.tokens.accessToken;

    // 3. Create Medicine
    const medRes = await request(app)
      .post("/api/medicines")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "FraudTest Medicine 100mg",
        genericName: "TestDrug",
        brandName: "FraudGuard",
        dosageForm: "Tablet",
        strength: "100mg",
        storageRequirements: "Standard",
      });
    medicineId = medRes.body.medicine.id;

    // 4. Create Batch
    const uniqueBatchNo = `BATCH-FRAUD-${Date.now()}`;
    const batchRes = await request(app)
      .post("/api/manufacturers/batches")
      .set("Authorization", `Bearer ${mfrToken}`)
      .send({
        medicineId: medicineId,
        batchNumber: uniqueBatchNo,
        mfgDate: "2026-01-01",
        expiryDate: "2028-12-31",
        quantity: 500,
        packageCount: 1,
      });

    batchId = batchRes.body.batch.id;
    packageQrPayload = batchRes.body.packages[0].encodedData;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("Fraud Path 1: Forged / Tampered QR signature returns INVALID_QR", async () => {
    // Decode valid QR payload container and tamper with signature
    const decodedJson = Buffer.from(packageQrPayload, "base64").toString("utf-8");
    const container = JSON.parse(decodedJson);

    // Tamper signature
    container.signature = "0000000000000000000000000000000000000000000000000000000000000000";
    const tamperedPayload = Buffer.from(JSON.stringify(container)).toString("base64");

    const res = await request(app).post("/api/verify/scan").send({
      d: tamperedPayload,
    });

    expect(res.status).toBe(200);
    expect(res.body.resultState).toBe("INVALID_QR");
    expect(res.body.authentic).toBe(false);
    expect(res.body.message).toContain("tampering detected");
  });

  it("Fraud Path 2: Recalled batch scan ALWAYS returns RECALLED state", async () => {
    // Admin recalls batch
    const recallRes = await request(app)
      .post(`/api/batches/${batchId}/recall`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        reason: "Contamination suspected during audit",
      });

    expect(recallRes.status).toBe(200);
    expect(recallRes.body.txHash).toBeDefined();

    // Scan package QR of recalled batch
    const scanRes = await request(app).post("/api/verify/scan").send({
      d: packageQrPayload,
    });

    expect(scanRes.status).toBe(200);
    expect(scanRes.body.resultState).toBe("RECALLED");
    expect(scanRes.body.authentic).toBe(false);
    expect(scanRes.body.message).toContain("RECALLED");
  });
});
