import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const directory = () => process.env.OPERATIONS_DIR ?? path.join(process.cwd(), "storage", "operations");
export type HealthRecord = { checkedAt: string; ok: boolean; lastSuccessAt?: string };
export function healthState(record: HealthRecord | null, maxAgeMs: number, now = Date.now()) {
  if (!record) return "missing";
  const checked = Date.parse(record.checkedAt);
  if (!Number.isFinite(checked) || checked > now + 60_000 || now - checked > maxAgeMs) return "stale";
  return record.ok ? "good" : "failed";
}
export async function readHealth(name: "worker" | "backup"): Promise<HealthRecord | null> {
  try {
    const value = JSON.parse(await readFile(path.join(directory(), `${name}.json`), "utf8"));
    if (typeof value.checkedAt !== "string" || !Number.isFinite(Date.parse(value.checkedAt)) || typeof value.ok !== "boolean") return null;
    return { checkedAt: value.checkedAt, ok: value.ok, lastSuccessAt: typeof value.lastSuccessAt === "string" ? value.lastSuccessAt : undefined };
  } catch { return null; }
}
export async function recordWorkerHealth(ok: boolean) {
  const previous = await readHealth("worker");
  const checkedAt = new Date().toISOString();
  await mkdir(directory(), { recursive: true });
  const temporary = path.join(directory(), `worker-${randomUUID()}.tmp`);
  await writeFile(temporary, JSON.stringify({ checkedAt, ok, lastSuccessAt: ok ? checkedAt : previous?.lastSuccessAt }), { mode: 0o600 });
  await rename(temporary, path.join(directory(), "worker.json"));
}
