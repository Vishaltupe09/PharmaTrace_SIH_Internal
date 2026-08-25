import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  console.log("Verifying getBatch() against deployed contract at:", contractAddress);

  const [admin, manufacturer] = await ethers.getSigners();
  const contract = await ethers.getContractAt("PharmaTrace", contractAddress);

  // Grant MANUFACTURER_ROLE to manufacturer
  const MANUFACTURER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MANUFACTURER_ROLE"));
  console.log("Granting MANUFACTURER_ROLE to:", manufacturer.address);
  const grantTx = await contract.grantRole(MANUFACTURER_ROLE, manufacturer.address);
  await grantTx.wait();

  // Test calling getBatch() before registration
  const nonExistentBatchId = ethers.id("NON-EXISTENT-BATCH");
  const batchBefore = await contract.getBatch(nonExistentBatchId);
  console.log("getBatch(nonExistentBatchId) exists:", batchBefore.exists);

  // Register a batch
  const testBatchId = ethers.id("TEST-VERIFY-BATCH-001");
  const testMetadataHash = ethers.id("METADATA-HASH-VERIFY-001");

  console.log("Registering test batch...");
  const regTx = await contract.connect(manufacturer).registerBatch(testBatchId, testMetadataHash);
  await regTx.wait();
  console.log("Test batch registered, tx hash:", regTx.hash);

  // Test calling getBatch() after registration
  const batchAfter = await contract.getBatch(testBatchId);
  console.log("getBatch(testBatchId) result:");
  console.log("  - exists:", batchAfter.exists);
  console.log("  - manufacturer:", batchAfter.manufacturer);
  console.log("  - currentCustodian:", batchAfter.currentCustodian);
  console.log("  - status:", batchAfter.status.toString());
  console.log("  - metadataHash:", batchAfter.metadataHash);

  if (batchAfter.exists && batchAfter.manufacturer === manufacturer.address) {
    console.log("SUCCESS: getBatch() call verified against deployed contract!");
  } else {
    throw new Error("Verification failed: getBatch output mismatch!");
  }
}

main().catch((error) => {
  console.error("Verification failed with error:", error);
  process.exitCode = 1;
});
