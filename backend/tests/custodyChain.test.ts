import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/utils/prisma";
import bcrypt from "bcryptjs";

describe("PharmaTrace Custody Chain Integration Test", () => {
  let adminToken: string;
  let mfrToken: string;
  let distToken: string;
  let wsToken: string;
  let pharmToken: string;

  let mfrUserId: string;
  let distUserId: string;
  let wsUserId: string;
  let pharmUserId: string;

  let mfrEntityId: string;
  let distEntityId: string;
  let wsEntityId: string;
  let pharmEntityId: string;

  let medicineId: string;
  let batchId: string;
  let shipmentId1: string;
  let shipmentId2: string;
  let shipmentId3: string;
  let batchQrPayload: string;

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
    await prisma.distributor.deleteMany();
    await prisma.wholesaler.deleteMany();
    await prisma.pharmacy.deleteMany();
    await prisma.user.deleteMany();

    // 1. Create Admin User
    const passwordHash = await bcrypt.hash("AdminPass123!", 10);
    await prisma.user.create({
      data: {
        email: "testadmin@pharmatrace.com",
        passwordHash,
        role: "ADMIN",
        status: "APPROVED",
        walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      },
    });

    // Login Admin
    const adminLoginRes = await request(app).post("/api/auth/login").send({
      email: "testadmin@pharmatrace.com",
      password: "AdminPass123!",
    });
    adminToken = adminLoginRes.body.tokens.accessToken;

    // 2. Create Sample Medicine
    const medRes = await request(app)
      .post("/api/medicines")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Deferasirox 500mg",
        genericName: "Deferasirox",
        brandName: "ThalassemiCure",
        dosageForm: "Tablet",
        strength: "500mg",
        storageRequirements: "Store below 30C",
      });
    medicineId = medRes.body.medicine.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("1. Register entity accounts (Mfr, Dist, Wholesaler, Pharmacy)", async () => {
    const mfrRes = await request(app).post("/api/auth/register").send({
      email: "mfr@apex.com",
      password: "MfrPass123!",
      role: "MANUFACTURER",
      orgName: "Apex Pharma Ltd",
      licenseNo: "LIC-MFR-2026-01",
    });
    expect(mfrRes.status).toBe(201);
    mfrUserId = mfrRes.body.user.id;

    const distRes = await request(app).post("/api/auth/register").send({
      email: "dist@medilog.com",
      password: "DistPass123!",
      role: "DISTRIBUTOR",
      orgName: "MediLogistics Pvt Ltd",
      licenseNo: "LIC-DIST-2026-01",
    });
    expect(distRes.status).toBe(201);
    distUserId = distRes.body.user.id;

    const wsRes = await request(app).post("/api/auth/register").send({
      email: "ws@globalhealth.com",
      password: "WsPass123!",
      role: "WHOLESALER",
      orgName: "Global Health Wholesalers",
      licenseNo: "LIC-WS-2026-01",
    });
    expect(wsRes.status).toBe(201);
    wsUserId = wsRes.body.user.id;

    const pharmRes = await request(app).post("/api/auth/register").send({
      email: "pharmacy@citycare.com",
      password: "PharmPass123!",
      role: "PHARMACY",
      orgName: "CityCare Pharmacy",
      licenseNo: "LIC-PHARM-2026-01",
    });
    expect(pharmRes.status).toBe(201);
    pharmUserId = pharmRes.body.user.id;
  });

  it("2. Admin approves all entity users & assigns backend-custodied wallets", async () => {
    const approveMfr = await request(app)
      .post(`/api/admin/users/${mfrUserId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(approveMfr.status).toBe(200);
    expect(approveMfr.body.user.walletAddress).toBeDefined();

    const approveDist = await request(app)
      .post(`/api/admin/users/${distUserId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(approveDist.status).toBe(200);

    const approveWs = await request(app)
      .post(`/api/admin/users/${wsUserId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(approveWs.status).toBe(200);

    const approvePharm = await request(app)
      .post(`/api/admin/users/${pharmUserId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(approvePharm.status).toBe(200);

    // Login users
    const mfrLogin = await request(app).post("/api/auth/login").send({
      email: "mfr@apex.com",
      password: "MfrPass123!",
    });
    mfrToken = mfrLogin.body.tokens.accessToken;
    mfrEntityId = mfrLogin.body.user.entity.id;

    const distLogin = await request(app).post("/api/auth/login").send({
      email: "dist@medilog.com",
      password: "DistPass123!",
    });
    distToken = distLogin.body.tokens.accessToken;
    distEntityId = distLogin.body.user.entity.id;

    const wsLogin = await request(app).post("/api/auth/login").send({
      email: "ws@globalhealth.com",
      password: "WsPass123!",
    });
    wsToken = wsLogin.body.tokens.accessToken;
    wsEntityId = wsLogin.body.user.entity.id;

    const pharmLogin = await request(app).post("/api/auth/login").send({
      email: "pharmacy@citycare.com",
      password: "PharmPass123!",
    });
    pharmToken = pharmLogin.body.tokens.accessToken;
    pharmEntityId = pharmLogin.body.user.entity.id;
  });

  it("3. Manufacturer creates a medicine batch & registers on-chain", async () => {
    const uniqueBatchNo = `BATCH-INTEG-${Date.now()}`;
    const batchRes = await request(app)
      .post("/api/manufacturers/batches")
      .set("Authorization", `Bearer ${mfrToken}`)
      .send({
        medicineId: medicineId,
        batchNumber: uniqueBatchNo,
        mfgDate: "2026-01-01",
        expiryDate: "2028-12-31",
        quantity: 1000,
        packageCount: 2,
      });

    expect(batchRes.status).toBe(201);
    expect(batchRes.body.batch.batchNumber).toBe(uniqueBatchNo);
    expect(batchRes.body.txHash).toBeDefined();
    expect(batchRes.body.batchQr.encodedData).toBeDefined();
    expect(batchRes.body.packages).toHaveLength(2);

    batchId = batchRes.body.batch.id;
    batchQrPayload = batchRes.body.batchQr.encodedData;
  });

  it("4. Manufacturer transfers custody to Distributor -> Distributor confirms receipt", async () => {
    // Mfr -> Dist
    const transfer1 = await request(app)
      .post("/api/shipments/transfer")
      .set("Authorization", `Bearer ${mfrToken}`)
      .send({
        batchId: batchId,
        fromEntityId: mfrEntityId,
        toEntityId: distEntityId,
      });
    expect(transfer1.status).toBe(200);
    expect(transfer1.body.shipment.status).toBe("IN_TRANSIT");
    shipmentId1 = transfer1.body.shipment.id;

    // Dist confirms receipt
    const confirm1 = await request(app)
      .post(`/api/shipments/${shipmentId1}/receive`)
      .set("Authorization", `Bearer ${distToken}`);
    expect(confirm1.status).toBe(200);
    expect(confirm1.body.shipment.status).toBe("RECEIVED");
  });

  it("5. Distributor transfers to Wholesaler -> Wholesaler confirms receipt", async () => {
    // Dist -> Wholesaler
    const transfer2 = await request(app)
      .post("/api/shipments/transfer")
      .set("Authorization", `Bearer ${distToken}`)
      .send({
        batchId: batchId,
        fromEntityId: distEntityId,
        toEntityId: wsEntityId,
      });
    expect(transfer2.status).toBe(200);
    shipmentId2 = transfer2.body.shipment.id;

    // Wholesaler confirms
    const confirm2 = await request(app)
      .post(`/api/shipments/${shipmentId2}/receive`)
      .set("Authorization", `Bearer ${wsToken}`);
    expect(confirm2.status).toBe(200);
  });

  it("6. Wholesaler transfers to Pharmacy -> Pharmacy confirms receipt", async () => {
    // Wholesaler -> Pharmacy
    const transfer3 = await request(app)
      .post("/api/shipments/transfer")
      .set("Authorization", `Bearer ${wsToken}`)
      .send({
        batchId: batchId,
        fromEntityId: wsEntityId,
        toEntityId: pharmEntityId,
      });
    expect(transfer3.status).toBe(200);
    shipmentId3 = transfer3.body.shipment.id;

    // Pharmacy confirms
    const confirm3 = await request(app)
      .post(`/api/shipments/${shipmentId3}/receive`)
      .set("Authorization", `Bearer ${pharmToken}`);
    expect(confirm3.status).toBe(200);
  });

  it("7. Pharmacy / Consumer scans QR code -> receives VERIFIED_AUTHENTIC result", async () => {
    const scanRes = await request(app).post("/api/verify/scan").send({
      d: batchQrPayload,
    });

    expect(scanRes.status).toBe(200);
    expect(scanRes.body.resultState).toBe("VERIFIED_AUTHENTIC");
    expect(scanRes.body.authentic).toBe(true);
    expect(scanRes.body.medicine.name).toBe("Deferasirox 500mg");
    expect(scanRes.body.batch.batchNumber).toBeDefined();
    expect(scanRes.body.aiRiskScore).toBeDefined();
    expect(scanRes.body.aiRiskScore.disclaimer).toContain("advisory indicator");
  });
});
