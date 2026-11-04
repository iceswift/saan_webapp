import "server-only";
import { db } from "./db";
import { AREA_CODES, type AreaCode, type ProviderKind } from "@/lib/constants";
import { isInThailand } from "@/lib/geo";
import type { DirectoryShop } from "@/lib/shop-directory";

/** Public business data only; never include customer/order locations or owner identifiers. */
export async function listDirectoryShops(): Promise<DirectoryShop[]> {
  const rows = await db.provider.findMany({
    where: { status: "VERIFIED" },
    select: { id: true, name: true, kind: true, publicAddress: true, contactHours: true, coverUrl: true, areas: true, baseLat: true, baseLng: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
  return rows.map(row => {
    let areas: AreaCode[] = [];
    try {
      const parsed: unknown = JSON.parse(row.areas);
      if (Array.isArray(parsed)) areas = AREA_CODES.filter(code => parsed.includes(code));
    } catch { /* Legacy invalid area JSON is treated as unspecified. */ }
    const point = row.baseLat !== null && row.baseLng !== null ? { lat: row.baseLat, lng: row.baseLng } : null;
    return { id: row.id, name: row.name, kind: row.kind as ProviderKind, address: row.publicAddress, contactHours: row.contactHours, coverUrl: row.coverUrl, areas,
      location: point && isInThailand(point) ? { lat: Math.round(point.lat * 1000) / 1000, lng: Math.round(point.lng * 1000) / 1000 } : null };
  });
}
