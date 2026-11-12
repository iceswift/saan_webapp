import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

export function labLoginConfig() {
  if (process.env.APP_ENV !== "production") return null;

  const userId = process.env.LAB_LOGIN_USER_ID;
  const tokenHash = process.env.LAB_LOGIN_TOKEN_SHA256;
  const expiry = Date.parse(process.env.LAB_LOGIN_EXPIRES_AT ?? "");
  const remaining = expiry - Date.now();

  if (!userId || !tokenHash || !/^[a-f0-9]{64}$/.test(tokenHash)) return null;
  if (!Number.isFinite(remaining) || remaining <= 0 || remaining > 24 * 60 * 60 * 1000) return null;

  return { userId, tokenHash, expiresAt: new Date(expiry) };
}

export function matchesLabLoginToken(token: unknown, tokenHash: string): boolean {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) return false;
  const actual = createHash("sha256").update(token).digest();
  return timingSafeEqual(actual, Buffer.from(tokenHash, "hex"));
}
