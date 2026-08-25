import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "pharmatrace_jwt_secret_dev_key_2026";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "pharmatrace_jwt_refresh_secret_dev_key_2026";

export interface RegisterInput {
  email: string;
  password: string;
  role: "ADMIN" | "MANUFACTURER" | "DISTRIBUTOR" | "WHOLESALER" | "PHARMACY" | "INSPECTOR";
  orgName?: string;
  licenseNo?: string;
}

export function generateTokens(payload: { userId: string; email: string; role: string }) {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    const err: any = new Error("User with this email already exists");
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  // Admin account defaults to APPROVED, others default to PENDING
  const userStatus = input.role === "ADMIN" ? "APPROVED" : "PENDING";

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      role: input.role as any,
      status: userStatus,
    },
  });

  if (input.orgName && input.licenseNo) {
    const entityData = {
      userId: user.id,
      orgName: input.orgName,
      licenseNo: input.licenseNo,
    };

    switch (input.role) {
      case "MANUFACTURER":
        await prisma.manufacturer.create({ data: entityData });
        break;
      case "DISTRIBUTOR":
        await prisma.distributor.create({ data: entityData });
        break;
      case "WHOLESALER":
        await prisma.wholesaler.create({ data: entityData });
        break;
      case "PHARMACY":
        await prisma.pharmacy.create({ data: entityData });
        break;
    }
  }

  return user;
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      manufacturer: true,
      distributor: true,
      wholesaler: true,
      pharmacy: true,
    },
  });

  if (!user) {
    const err: any = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const err: any = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  if (user.status === "PENDING") {
    const err: any = new Error("Account registration is pending admin approval");
    err.statusCode = 403;
    throw err;
  }

  if (user.status === "REJECTED") {
    const err: any = new Error("Account registration has been rejected");
    err.statusCode = 403;
    throw err;
  }

  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      walletAddress: user.walletAddress,
      entity:
        user.manufacturer ||
        user.distributor ||
        user.wholesaler ||
        user.pharmacy ||
        null,
    },
    tokens,
  };
}
