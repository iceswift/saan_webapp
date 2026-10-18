import "server-only";
import { z } from "zod";

type Environment = Record<string, string | undefined>;
const chargeSchema = z.object({
  object: z.literal("charge"), id: z.string().regex(/^chrg_test_[a-z0-9]+$/),
  livemode: z.literal(false), amount: z.number().int().positive(), currency: z.string(),
  status: z.enum(["pending", "successful", "failed", "expired", "reversed"]),
  paid: z.boolean(), ref_id: z.string().optional().nullable(),
  source: z.object({ type: z.literal("promptpay"),
    scannable_code: z.object({ image: z.object({ download_uri: z.string().url() }) }).nullable().optional(),
  }),
  expires_at: z.string().datetime().nullable().optional(),
});

export type TestCharge = z.infer<typeof chargeSchema>;
export type ChargeExpectation = { amountMinor: number; reference: string; chargeId?: string };
export class OmiseTestError extends Error {
  constructor(readonly code: "CONFIGURATION" | "REJECTED" | "UNKNOWN" | "MISMATCH") {
    super(`Omise test: ${code}`);
    this.name = "OmiseTestError";
  }
}

/** Contract-spike client only. Deliberately not registered as the application's gateway.
 * No retry of POST, no live keys, no refund/transfer methods, no arbitrary API origin.
 */
export function createOmiseTestClient(
  env: Environment = process.env,
  transport: typeof fetch = fetch,
) {
  const key = env.OMISE_TEST_SECRET_KEY;
  const version = env.OMISE_API_VERSION;
  if (!key || !/^skey_test_[a-zA-Z0-9]+$/.test(key) ||
      !version || !/^\d{4}-\d{2}-\d{2}$/.test(version) ||
      env.APP_ENV === "production") throw new OmiseTestError("CONFIGURATION");

  async function request(path: string, body?: URLSearchParams): Promise<unknown> {
    try {
      const response = await transport(`https://api.omise.co${path}`, {
        method: body ? "POST" : "GET", redirect: "error", cache: "no-store",
        signal: AbortSignal.timeout(15_000),
        headers: {
          Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
          "Omise-Version": version!,
          ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
        },
        body: body?.toString(),
      });
      // Rate limiting, server errors and malformed replies do not establish non-creation.
      if (!response.ok) {
        throw new OmiseTestError(response.status >= 400 && response.status < 500 &&
          ![408, 409, 429].includes(response.status) ? "REJECTED" : "UNKNOWN");
      }
      return await response.json();
    } catch (error) {
      if (error instanceof OmiseTestError) throw error;
      // Never propagate provider bodies, credentials, network errors or request headers.
      throw new OmiseTestError("UNKNOWN");
    }
  }

  function validateExpected(expected: ChargeExpectation) {
    if (!Number.isSafeInteger(expected.amountMinor) || expected.amountMinor < 2_000 ||
        expected.amountMinor > 15_000_000 || !/^[a-zA-Z0-9:_-]{1,100}$/.test(expected.reference)) {
      throw new OmiseTestError("CONFIGURATION");
    }
  }

  function parse(value: unknown, expected: ChargeExpectation): TestCharge {
    const parsed = chargeSchema.safeParse(value);
    if (!parsed.success) throw new OmiseTestError("MISMATCH");
    const charge = parsed.data;
    if (charge.amount !== expected.amountMinor || charge.currency.toUpperCase() !== "THB" ||
        (expected.chargeId && charge.id !== expected.chargeId) ||
        (charge.ref_id != null && charge.ref_id !== expected.reference) ||
        charge.paid !== (charge.status === "successful")) throw new OmiseTestError("MISMATCH");
    const qr = charge.source.scannable_code?.image.download_uri;
    if (qr && new URL(qr).protocol !== "https:") throw new OmiseTestError("MISMATCH");
    return charge;
  }

  return {
    async createPromptPay(expected: ChargeExpectation, expiresAt: string): Promise<TestCharge> {
      validateExpected(expected);
      const expiry = Date.parse(expiresAt);
      const remaining = expiry - Date.now();
      if (!Number.isFinite(expiry) || remaining <= 0 || remaining > 86_400_000) {
        throw new OmiseTestError("CONFIGURATION");
      }
      const body = new URLSearchParams({ amount: String(expected.amountMinor), currency: "THB",
        "source[type]": "promptpay", ref_id: expected.reference, expires_at: new Date(expiry).toISOString(),
        "metadata[saan_reference]": expected.reference });
      return parse(await request("/charges", body), expected);
    },
    async retrievePromptPay(expected: ChargeExpectation & { chargeId: string }): Promise<TestCharge> {
      validateExpected(expected);
      if (!/^chrg_test_[a-z0-9]+$/.test(expected.chargeId)) throw new OmiseTestError("CONFIGURATION");
      return parse(await request(`/charges/${expected.chargeId}`), expected);
    },
  };
}
