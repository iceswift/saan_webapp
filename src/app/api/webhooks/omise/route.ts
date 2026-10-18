import { verifyOmiseWebhookSignature } from "@/server/omise-webhook-signature";
import { storeOmiseEvent } from "@/server/omise-webhook-inbox";
import { IS_OMISE_TEST_PAYMENT } from "@/server/integrations";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!IS_OMISE_TEST_PAYMENT || process.env.OMISE_WEBHOOK_ENABLED !== "true") return new Response(null, { status: 404 });
  const secret = process.env.OMISE_WEBHOOK_SECRET;
  if (!secret) return new Response(null, { status: 503 });
  // Stream limit also protects requests with no/misleading Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return new Response(null, { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1_048_576) { await reader.cancel(); return new Response(null, { status: 413 }); }
      chunks.push(value);
    }
    const body = Buffer.concat(chunks);
    if (!verifyOmiseWebhookSignature({ body, signature: request.headers.get("omise-signature"),
      timestamp: request.headers.get("omise-signature-timestamp"),
      secrets: [secret, process.env.OMISE_WEBHOOK_PREVIOUS_SECRET].filter((v): v is string => Boolean(v)) })) {
      return new Response(null, { status: 401 });
    }
    await storeOmiseEvent(body);
    return new Response(null, { status: 204 });
  } catch (error) { return new Response(null, { status: error instanceof SyntaxError ? 400 : 503 }); }
}
