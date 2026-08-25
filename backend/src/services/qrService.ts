import crypto from "crypto";
import QRCode from "qrcode";
import dotenv from "dotenv";

dotenv.config();

const QR_SIGNING_SECRET = process.env.QR_SIGNING_SECRET || "pharmatrace_qr_hmac_secret_2026";

export interface QrPayload {
  id: string;
  type: "batch" | "package";
  batchId: string;
  nonce: string;
  issuedAt: number;
}

export function computeQrSignature(payload: QrPayload): string {
  const canonicalString = `${payload.id}:${payload.type}:${payload.batchId}:${payload.nonce}:${payload.issuedAt}`;
  return crypto.createHmac("sha256", QR_SIGNING_SECRET).update(canonicalString).digest("hex");
}

export function generateQrPayload(id: string, type: "batch" | "package", batchId: string): {
  payload: QrPayload;
  signature: string;
  encodedData: string;
} {
  const payload: QrPayload = {
    id,
    type,
    batchId,
    nonce: crypto.randomBytes(8).toString("hex"),
    issuedAt: Date.now(),
  };

  const signature = computeQrSignature(payload);
  const container = {
    payload,
    signature,
  };

  const encodedData = Buffer.from(JSON.stringify(container)).toString("base64");
  return { payload, signature, encodedData };
}

export async function renderQrCodeDataUrl(encodedData: string): Promise<string> {
  const verificationUrl = `${process.env.CORS_ORIGIN || "http://localhost:5173"}/verify?d=${encodedData}`;
  return QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 300,
  });
}

export function verifyQrPayload(encodedDataOrContainer: string | { payload: QrPayload; signature: string }): {
  valid: boolean;
  payload?: QrPayload;
  reason?: string;
} {
  try {
    let container: { payload: QrPayload; signature: string };

    if (typeof encodedDataOrContainer === "string") {
      const decodedJson = Buffer.from(encodedDataOrContainer, "base64").toString("utf-8");
      container = JSON.parse(decodedJson);
    } else {
      container = encodedDataOrContainer;
    }

    if (!container.payload || !container.signature) {
      return { valid: false, reason: "Malformed QR container structure" };
    }

    const expectedSignature = computeQrSignature(container.payload);
    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(container.signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );

    if (!isSignatureValid) {
      return { valid: false, reason: "Invalid QR HMAC signature — tampering detected" };
    }

    return { valid: true, payload: container.payload };
  } catch (err: any) {
    return { valid: false, reason: `Failed to decode QR payload: ${err.message}` };
  }
}
