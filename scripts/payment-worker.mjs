// Bounded HTTP scheduler; app owns provider credentials, inbox and finalization.
const target = process.env.PAYMENT_WORKER_URL ?? "http://app:3000/api/internal/payment-reconcile";
const url = new URL(target);
if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
    url.pathname !== "/api/internal/payment-reconcile") throw new Error("Invalid worker target");
const secret = process.env.PAYMENT_WORKER_SECRET;
if (!secret || secret.length < 32) throw new Error("Worker secret is not configured");
let stopping = false;
process.on("SIGTERM", () => { stopping = true; });
process.on("SIGINT", () => { stopping = true; });
while (!stopping) {
  try {
    const response = await fetch(url, { method: "POST", redirect: "error", signal: AbortSignal.timeout(180_000),
      headers: { Authorization: `Bearer ${secret}` } });
    if (!response.ok) console.error(`Payment reconciliation HTTP ${response.status}`);
  } catch { console.error("Payment reconciliation unavailable"); }
  for (let seconds = 0; seconds < 15 && !stopping; seconds++) await new Promise((resolve) => setTimeout(resolve, 1000));
}
