import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/** Verify bytes before parsing JSON. This authenticates delivery only, not payment.
 * The future inbox worker must independently retrieve and validate the charge.
 */
export function verifyOmiseWebhookSignature(input: {
  body: Uint8Array;
  signature: string | null;
  timestamp: string | null;
  secrets: readonly string[];
  nowSeconds?: number;
}): boolean {
  const { body, signature, timestamp, secrets } = input;
  if (body.byteLength > 1_048_576 || !signature || signature.length > 1024 ||
      !timestamp || !/^\d{1,12}$/.test(timestamp) || !secrets.length || secrets.length > 2) return false;
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (!Number.isFinite(now) || Math.abs(now - Number(timestamp)) > 300) return false;
  const candidates = signature.split(",").map((value) => value.trim());
  if (candidates.length > 2 || candidates.some((value) => !/^[a-fA-F0-9]{64}$/.test(value))) return false;
  // Reject invalid secret configuration instead of silently accepting partial rotation.
  const keys: Buffer[] = [];
  for (const secret of secrets) {
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(secret)) return false;
    const key = Buffer.from(secret, "base64");
    if (!key.length || key.toString("base64") !== secret) return false;
    keys.push(key);
  }
  let matches = false;
  for (const key of keys) {
    const expected = createHmac("sha256", key).update(`${timestamp}.`).update(body).digest();
    for (const candidate of candidates) {
      matches = timingSafeEqual(expected, Buffer.from(candidate, "hex")) || matches;
    }
  }
  return matches;
}
