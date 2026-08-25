import { ethers } from "ethers";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";

// Load ABI
const abiPath = path.join(__dirname, "../contracts/PharmaTrace.abi.json");
const contractAbi = JSON.parse(fs.readFileSync(abiPath, "utf-8"));

export const provider = new ethers.JsonRpcProvider(RPC_URL);
export const defaultSigner = new ethers.Wallet(SIGNER_PRIVATE_KEY, provider);

// Mutex lock to serialize outgoing blockchain transactions sequentially
let txLock = Promise.resolve();

async function runWithTxLock<T>(fn: () => Promise<T>): Promise<T> {
  let resolveLock: () => void;
  const nextLock = new Promise<void>((res) => {
    resolveLock = res;
  });

  const previousLock = txLock;
  txLock = nextLock;

  await previousLock;
  try {
    return await fn();
  } finally {
    resolveLock!();
  }
}

async function getFreshNonce(address: string): Promise<number> {
  const hexCount = await provider.send("eth_getTransactionCount", [address, "latest"]);
  return parseInt(hexCount, 16);
}

export function getContract(signerOrProvider: ethers.Signer | ethers.Provider = defaultSigner) {
  return new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signerOrProvider);
}

export function formatBytes32Id(id: string): string {
  if (id.startsWith("0x") && id.length === 66) {
    return id;
  }
  return ethers.id(id);
}

export function generateWallet(): { address: string; privateKey: string } {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

let rolesInitialized = false;
async function ensureDefaultSignerRoles() {
  if (rolesInitialized) return;
  try {
    const contract = getContract(defaultSigner);
    const mfrRole = ethers.keccak256(ethers.toUtf8Bytes("MANUFACTURER_ROLE"));
    const hasRole = await contract.hasRole(mfrRole, defaultSigner.address);
    if (!hasRole) {
      const nonce = await getFreshNonce(defaultSigner.address);
      const tx = await contract.grantRole(mfrRole, defaultSigner.address, { nonce });
      await tx.wait();
    }
    rolesInitialized = true;
  } catch (err: any) {
    console.error("Notice: ensureDefaultSignerRoles info:", err.message);
  }
}

export async function grantEntityRole(walletAddress: string, roleName: string): Promise<string> {
  return runWithTxLock(async () => {
    const contract = getContract(defaultSigner);
    let roleHash: string;

    switch (roleName.toUpperCase()) {
      case "MANUFACTURER":
        roleHash = ethers.keccak256(ethers.toUtf8Bytes("MANUFACTURER_ROLE"));
        break;
      case "DISTRIBUTOR":
        roleHash = ethers.keccak256(ethers.toUtf8Bytes("DISTRIBUTOR_ROLE"));
        break;
      case "WHOLESALER":
        roleHash = ethers.keccak256(ethers.toUtf8Bytes("WHOLESALER_ROLE"));
        break;
      case "PHARMACY":
        roleHash = ethers.keccak256(ethers.toUtf8Bytes("PHARMACY_ROLE"));
        break;
      default:
        throw new Error(`Invalid role for blockchain grant: ${roleName}`);
    }

    const nonce = await getFreshNonce(defaultSigner.address);
    const tx = await contract.grantRole(roleHash, walletAddress, { nonce });
    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1) {
      throw new Error(`Transaction reverted while granting role ${roleName} to ${walletAddress}`);
    }
    return tx.hash;
  });
}

export async function registerBatchOnChain(
  batchId: string,
  metadataHash: string,
  manufacturerPrivateKey?: string
): Promise<string> {
  return runWithTxLock(async () => {
    await ensureDefaultSignerRoles();
    const signer = manufacturerPrivateKey
      ? new ethers.Wallet(manufacturerPrivateKey, provider)
      : defaultSigner;
    const contract = getContract(signer);

    const bytes32BatchId = formatBytes32Id(batchId);
    const bytes32MetaHash = formatBytes32Id(metadataHash);

    const nonce = await getFreshNonce(signer.address);
    const tx = await contract.registerBatch(bytes32BatchId, bytes32MetaHash, { nonce });
    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1) {
      throw new Error(`On-chain transaction reverted for registerBatch (${batchId})`);
    }
    return tx.hash;
  });
}

export async function transferCustodyOnChain(
  batchId: string,
  toWalletAddress: string,
  fromPrivateKey?: string
): Promise<string> {
  return runWithTxLock(async () => {
    const signer = fromPrivateKey
      ? new ethers.Wallet(fromPrivateKey, provider)
      : defaultSigner;
    const contract = getContract(signer);
    const bytes32BatchId = formatBytes32Id(batchId);

    const nonce = await getFreshNonce(signer.address);
    const tx = await contract.transferCustody(bytes32BatchId, toWalletAddress, { nonce });
    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1) {
      throw new Error(`On-chain transaction reverted for transferCustody (${batchId})`);
    }
    return tx.hash;
  });
}

export async function confirmReceiptOnChain(
  batchId: string,
  recipientPrivateKey?: string
): Promise<string> {
  return runWithTxLock(async () => {
    const signer = recipientPrivateKey
      ? new ethers.Wallet(recipientPrivateKey, provider)
      : defaultSigner;
    const contract = getContract(signer);
    const bytes32BatchId = formatBytes32Id(batchId);

    const nonce = await getFreshNonce(signer.address);
    const tx = await contract.confirmReceipt(bytes32BatchId, { nonce });
    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1) {
      throw new Error(`On-chain transaction reverted for confirmReceipt (${batchId})`);
    }
    return tx.hash;
  });
}

export async function flagBatchOnChain(batchId: string, reason: string): Promise<string> {
  return runWithTxLock(async () => {
    const contract = getContract(defaultSigner);
    const bytes32BatchId = formatBytes32Id(batchId);

    const nonce = await getFreshNonce(defaultSigner.address);
    const tx = await contract.flagBatch(bytes32BatchId, reason, { nonce });
    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1) {
      throw new Error(`On-chain transaction reverted for flagBatch (${batchId})`);
    }
    return tx.hash;
  });
}

export async function recallBatchOnChain(batchId: string, reason: string): Promise<string> {
  return runWithTxLock(async () => {
    const contract = getContract(defaultSigner);
    const bytes32BatchId = formatBytes32Id(batchId);

    const nonce = await getFreshNonce(defaultSigner.address);
    const tx = await contract.recallBatch(bytes32BatchId, reason, { nonce });
    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1) {
      throw new Error(`On-chain transaction reverted for recallBatch (${batchId})`);
    }
    return tx.hash;
  });
}

export async function getBatchFromChain(batchId: string) {
  const contract = getContract(provider);
  const bytes32BatchId = formatBytes32Id(batchId);

  const rawBatch = await contract.getBatch(bytes32BatchId);
  return {
    batchId: rawBatch.batchId,
    metadataHash: rawBatch.metadataHash,
    manufacturer: rawBatch.manufacturer,
    currentCustodian: rawBatch.currentCustodian,
    status: Number(rawBatch.status),
    createdAt: Number(rawBatch.createdAt),
    exists: Boolean(rawBatch.exists),
  };
}
