import { timingSafeEqual } from "node:crypto";
import { reconcileOmiseBatch } from "@/server/omise-webhook-inbox";
import { reconcileTestPayoutBatch } from "@/server/omise-payout-service";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const secret = process.env.PAYMENT_WORKER_SECRET;
  if (!secret || secret.length < 32 || process.env.PAYMENT_RECONCILIATION_ENABLED !== "true") return new Response(null, { status: 404 });
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return new Response(null, { status: 401 });
  try { return Response.json({...await reconcileOmiseBatch(),payoutsChecked:await reconcileTestPayoutBatch()}); }
  catch { return new Response(null, { status: 503 }); }
}
