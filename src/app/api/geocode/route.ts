import { isInThailand } from "@/lib/geo";

/**
 * ค้นหาสถานที่ (geocode) ผ่าน Nominatim ของ OpenStreetMap: GET /api/geocode?q=ลาดพร้าว -> [{label, lat, lng}]
 * ข้อควรระวัง: นโยบายของ Nominatim ห้ามใช้หนัก (สูงสุด 1 คำขอ/วินาที ต้องมี User-Agent และควรแคช)
 * จึงมีการหน่วง 1 วินาทีต่อโปรเซส แคช 5 นาที และจำกัด 20 ครั้ง/นาที/IP งานจริงให้เปลี่ยนเป็น Longdo หรือ Google
 * ล้มเหลวทุกกรณีให้ผลเป็น [] เสมอ
 */

type Result = { label: string; lat: number; lng: number };

const CACHE_MS = 5 * 60_000;
const TIMEOUT_MS = 3000;
const MIN_GAP_MS = 1000;
const IP_LIMIT = 20;

const cache = new Map<string, { at: number; data: Result[] }>();
const ipHits = new Map<string, { windowStart: number; count: number }>();
let lastCall = 0;
let queue: Promise<void> = Promise.resolve();

function overLimit(ip: string): boolean {
  const now = Date.now();
  const hit = ipHits.get(ip);
  if (!hit || now - hit.windowStart > 60_000) {
    ipHits.set(ip, { windowStart: now, count: 1 });
    if (ipHits.size > 2000) {
      for (const [k, v] of ipHits) if (now - v.windowStart > 60_000) ipHits.delete(k);
    }
    return false;
  }
  hit.count += 1;
  return hit.count > IP_LIMIT;
}

/** เข้าคิวให้แต่ละคำขอห่างกันอย่างน้อย 1 วินาที */
function throttle(): Promise<void> {
  const run = queue.then(async () => {
    const wait = lastCall + MIN_GAP_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCall = Date.now();
  });
  queue = run.catch(() => undefined);
  return run;
}

export async function GET(request: Request) {
  const empty = () => Response.json([] satisfies Result[]);
  try {
    const q = (new URL(request.url).searchParams.get("q") ?? "").trim();
    if (q.length < 3 || q.length > 100) return empty();

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (overLimit(ip)) return empty();

    const key = q.toLowerCase();
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) return Response.json(hit.data);

    await throttle();
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("countrycodes", "th");
    url.searchParams.set("accept-language", "th");
    url.searchParams.set("limit", "5");
    url.searchParams.set("q", q);

    const res = await fetch(url, {
      headers: { "User-Agent": "Saan/0.1 (contact: see SUPPORT)", Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return empty();
    const rows = (await res.json()) as { display_name?: string; lat?: string; lon?: string }[];
    const data: Result[] = [];
    for (const row of Array.isArray(rows) ? rows : []) {
      const lat = Number(row.lat);
      const lng = Number(row.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !row.display_name) continue;
      if (!isInThailand({ lat, lng })) continue;
      data.push({ label: row.display_name, lat, lng });
    }
    if (cache.size > 500) cache.clear();
    cache.set(key, { at: Date.now(), data });
    return Response.json(data);
  } catch {
    return empty();
  }
}
