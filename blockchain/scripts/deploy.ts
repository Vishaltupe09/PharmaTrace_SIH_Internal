import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying PharmaTrace smart contract with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const Factory = await ethers.getContractFactory("PharmaTrace");
  const contract = await Factory.deploy(deployer.address);

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("PharmaTrace contract deployed to address:", contractAddress);
}

main().catch((error) => {
  console.error("Error during deployment:", error);
  process.exitCode = 1;
});
