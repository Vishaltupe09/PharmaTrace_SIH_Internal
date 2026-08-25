import { expect } from "chai";
import { ethers } from "hardhat";
import { PharmaTrace } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("PharmaTrace Contract Unit Tests", function () {
  let contract: PharmaTrace;
  let admin: HardhatEthersSigner;
  let manufacturer: HardhatEthersSigner;
  let distributor: HardhatEthersSigner;
  let wholesaler: HardhatEthersSigner;
  let pharmacy: HardhatEthersSigner;
  let unauthorized: HardhatEthersSigner;

  const MANUFACTURER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MANUFACTURER_ROLE"));
  const DISTRIBUTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DISTRIBUTOR_ROLE"));
  const WHOLESALER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("WHOLESALER_ROLE"));
  const PHARMACY_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PHARMACY_ROLE"));

  const sampleBatchId = ethers.id("BATCH-2026-001");
  const sampleMetadataHash = ethers.id("METADATA-HASH-2026-001");

  beforeEach(async function () {
    [admin, manufacturer, distributor, wholesaler, pharmacy, unauthorized] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("PharmaTrace");
    contract = await Factory.deploy(admin.address);
    await contract.waitForDeployment();

    // Grant roles
    await contract.grantRole(MANUFACTURER_ROLE, manufacturer.address);
    await contract.grantRole(DISTRIBUTOR_ROLE, distributor.address);
    await contract.grantRole(WHOLESALER_ROLE, wholesaler.address);
    await contract.grantRole(PHARMACY_ROLE, pharmacy.address);
  });

  describe("Deployment & Roles", function () {
    it("should set deployer admin role correctly", async function () {
      const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
      expect(await contract.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("should correctly verify granted roles", async function () {
      expect(await contract.hasRole(MANUFACTURER_ROLE, manufacturer.address)).to.be.true;
      expect(await contract.hasRole(DISTRIBUTOR_ROLE, distributor.address)).to.be.true;
      expect(await contract.hasRole(WHOLESALER_ROLE, wholesaler.address)).to.be.true;
      expect(await contract.hasRole(PHARMACY_ROLE, pharmacy.address)).to.be.true;
      expect(await contract.hasRole(MANUFACTURER_ROLE, unauthorized.address)).to.be.false;
    });
  });

  describe("Batch Registration", function () {
    it("should allow manufacturer to register a batch", async function () {
      await expect(contract.connect(manufacturer).registerBatch(sampleBatchId, sampleMetadataHash))
        .to.emit(contract, "BatchRegistered")
        .withArgs(sampleBatchId, manufacturer.address, sampleMetadataHash, (val: bigint) => val > 0n);

      const batch = await contract.getBatch(sampleBatchId);
      expect(batch.exists).to.be.true;
      expect(batch.manufacturer).to.equal(manufacturer.address);
      expect(batch.currentCustodian).to.equal(manufacturer.address);
      expect(batch.status).to.equal(0n); // CREATED
    });

    it("should revert if batch ID already exists", async function () {
      await contract.connect(manufacturer).registerBatch(sampleBatchId, sampleMetadataHash);
      await expect(
        contract.connect(manufacturer).registerBatch(sampleBatchId, sampleMetadataHash)
      ).to.be.revertedWith("Batch already exists");
    });

    it("should revert if metadata hash is zero", async function () {
      await expect(
        contract.connect(manufacturer).registerBatch(sampleBatchId, ethers.ZeroHash)
      ).to.be.revertedWith("Invalid hash");
    });

    it("should revert if non-manufacturer attempts registration", async function () {
      await expect(
        contract.connect(unauthorized).registerBatch(sampleBatchId, sampleMetadataHash)
      ).to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Custody Transfer & Receipt Confirmation", function () {
    beforeEach(async function () {
      await contract.connect(manufacturer).registerBatch(sampleBatchId, sampleMetadataHash);
    });

    it("should allow current custodian to initiate transfer", async function () {
      await expect(contract.connect(manufacturer).transferCustody(sampleBatchId, distributor.address))
        .to.emit(contract, "CustodyTransferred")
        .withArgs(sampleBatchId, manufacturer.address, distributor.address, (val: bigint) => val > 0n);

      const batch = await contract.getBatch(sampleBatchId);
      expect(batch.currentCustodian).to.equal(distributor.address);
      expect(batch.status).to.equal(1n); // IN_TRANSIT
    });

    it("should allow designated recipient to confirm receipt", async function () {
      await contract.connect(manufacturer).transferCustody(sampleBatchId, distributor.address);

      await expect(contract.connect(distributor).confirmReceipt(sampleBatchId))
        .to.emit(contract, "ReceiptConfirmed")
        .withArgs(sampleBatchId, distributor.address, (val: bigint) => val > 0n);

      const batch = await contract.getBatch(sampleBatchId);
      expect(batch.status).to.equal(2n); // RECEIVED
    });

    it("should revert transfer if non-custodian attempts to transfer", async function () {
      await expect(
        contract.connect(unauthorized).transferCustody(sampleBatchId, distributor.address)
      ).to.be.revertedWith("Not current custodian");
    });

    it("should revert receipt confirmation if caller is not current custodian", async function () {
      await contract.connect(manufacturer).transferCustody(sampleBatchId, distributor.address);
      await expect(
        contract.connect(unauthorized).confirmReceipt(sampleBatchId)
      ).to.be.revertedWith("Not recipient");
    });
  });

  describe("Flagging & Recall", function () {
    beforeEach(async function () {
      await contract.connect(manufacturer).registerBatch(sampleBatchId, sampleMetadataHash);
    });

    it("should allow flagging a batch with reason", async function () {
      await expect(contract.connect(pharmacy).flagBatch(sampleBatchId, "Damaged packaging"))
        .to.emit(contract, "BatchFlagged")
        .withArgs(sampleBatchId, "Damaged packaging", (val: bigint) => val > 0n);

      const batch = await contract.getBatch(sampleBatchId);
      expect(batch.status).to.equal(3n); // FLAGGED
    });

    it("should allow Admin to recall a batch", async function () {
      await expect(contract.connect(admin).recallBatch(sampleBatchId, "Contamination alert"))
        .to.emit(contract, "BatchRecalled")
        .withArgs(sampleBatchId, "Contamination alert", (val: bigint) => val > 0n);

      const batch = await contract.getBatch(sampleBatchId);
      expect(batch.status).to.equal(4n); // RECALLED
    });

    it("should prevent custody transfer on recalled batch", async function () {
      await contract.connect(admin).recallBatch(sampleBatchId, "Contamination alert");
      await expect(
        contract.connect(manufacturer).transferCustody(sampleBatchId, distributor.address)
      ).to.be.revertedWith("Batch recalled");
    });

    it("should revert recall attempt by non-admin", async function () {
      await expect(
        contract.connect(manufacturer).recallBatch(sampleBatchId, "Unauthorized recall")
      ).to.be.revertedWithCustomError(contract, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Pausable Guardrails", function () {
    it("should allow admin to pause and block state mutating actions", async function () {
      await contract.connect(admin).pause();

      await expect(
        contract.connect(manufacturer).registerBatch(sampleBatchId, sampleMetadataHash)
      ).to.be.revertedWithCustomError(contract, "EnforcedPause");

      await contract.connect(admin).unpause();
      await expect(contract.connect(manufacturer).registerBatch(sampleBatchId, sampleMetadataHash)).to.not.be.reverted;
    });
  });
});
