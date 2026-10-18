import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { createOmiseTestClient, OmiseTestError } from "../src/server/omise-test-client";

const journalSchema = z.object({
  reference: z.string(), amountMinor: z.number().int(),
  state: z.enum(["RESERVED", "OBSERVED", "UNKNOWN"]),
  chargeId: z.string().regex(/^chrg_test_[a-z0-9]+$/).optional(),
  status: z.string().optional(), paid: z.boolean().optional(), updatedAt: z.string(),
  qrPresent: z.boolean().optional(), referenceEchoed: z.boolean().optional(),
  expiresAt: z.string().nullable().optional(),
});

async function main() {
  const [command, reference, amountText] = process.argv.slice(2);
  if (!["create", "retrieve"].includes(command) || !/^[a-zA-Z0-9:_-]{1,100}$/.test(reference ?? "") ||
      !/^\d+$/.test(amountText ?? "")) {
    throw new Error("Usage: npm run payment:omise:spike -- create|retrieve <unique-reference> <amount-satang>");
  }
  const amountMinor = Number(amountText);
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 2_000 || amountMinor > 15_000_000) {
    throw new Error("Amount must be integer satang within PromptPay limits.");
  }
  const client = createOmiseTestClient();
  const directory = path.resolve("storage/omise-contract-spike");
  const file = path.join(directory, `${createHash("sha256").update(reference).digest("hex")}.json`);
  const expected = { reference, amountMinor };
  let journal: z.infer<typeof journalSchema>;
  if (command === "create") {
    if (process.env.OMISE_CONTRACT_SPIKE_CREATE !== "true") {
      throw new Error("Creation requires OMISE_CONTRACT_SPIKE_CREATE=true. This tool never creates live charges.");
    }
    await mkdir(directory, { recursive: true });
    journal = { ...expected, state: "RESERVED", updatedAt: new Date().toISOString() };
    // Exclusive reservation survives process failure and prevents a second dispatch.
    // Never delete this reservation to retry an uncertain external request.
    await writeFile(file, JSON.stringify(journal, null, 2), { flag: "wx", mode: 0o600 });
  } else {
    journal = journalSchema.parse(JSON.parse(await readFile(file, "utf8")));
    if (journal.reference !== reference || journal.amountMinor !== amountMinor) throw new Error("Journal mismatch.");
    if (!journal.chargeId) throw new Error("No confirmed charge ID. Reconcile in Omise; do not create another attempt.");
  }
  try {
    const charge = command === "create"
      ? await client.createPromptPay(expected, new Date(Date.now() + 900_000).toISOString())
      : await client.retrievePromptPay({ ...expected, chargeId: journal.chargeId! });
    journal = { ...journal, state: "OBSERVED", chargeId: charge.id,
      status: charge.status, paid: charge.paid, updatedAt: new Date().toISOString(),
      qrPresent: Boolean(charge.source.scannable_code?.image.download_uri),
      referenceEchoed: charge.ref_id === reference, expiresAt: charge.expires_at };
    // Keep only sanitized evidence; no QR payload, credentials or raw provider body.
    const temporary = `${file}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify(journal, null, 2), { flag: "wx", mode: 0o600 });
    await rename(temporary, file);
    console.log(JSON.stringify(journal, null, 2));
  } catch (error) {
    // The original RESERVED/OBSERVED record is intentionally retained on failure.
    console.error(error instanceof OmiseTestError ? error.message : "Spike failed; preserve the journal and reconcile before retrying.");
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  if (error instanceof OmiseTestError) console.error(error.message);
  else if (error instanceof Error && "code" in error && error.code === "EEXIST") {
    console.error("Reference already reserved. Use retrieve; never delete an uncertain reservation to retry.");
  } else console.error("Check command/configuration and existing journal. No automatic retries were performed.");
  process.exitCode = 1;
});
