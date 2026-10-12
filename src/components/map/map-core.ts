import type * as Leaflet from "leaflet";
import type { LatLng } from "@/lib/geo";

export type LeafletNS = typeof Leaflet;

/** โหลด leaflet แบบขี้เกียจ (ต้องเรียกในเบราว์เซอร์เท่านั้น เช่นใน useEffect) */
export async function loadLeaflet(): Promise<LeafletNS> {
  const mod = (await import("leaflet")) as unknown as { default?: LeafletNS } & LeafletNS;
  return mod.default ?? mod;
}

/**
 * แผ่นภาพแผนที่ OpenStreetMap มาตรฐาน (ใช้ได้กับงานทดลอง)
 * งานจริงที่มีผู้ใช้มาก ต้องเปลี่ยนเป็นผู้ให้บริการแผ่นภาพเชิงพาณิชย์หรือ Longdo ตามนโยบายของ OSM
 */
export const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

export type MarkerTone = "customer" | "shop";

export function pinIcon(L: LeafletNS, tone: MarkerTone = "customer") {
  return L.divIcon({
    className: "saan-pin-wrap",
    html: `<span class="saan-pin ${tone === "shop" ? "saan-pin--shop" : ""}"></span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    tooltipAnchor: [16, -20],
  });
}

export function createBaseMap(L: LeafletNS, el: HTMLElement, options?: Leaflet.MapOptions) {
  const map = L.map(el, {
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: true,
    ...options,
  });
  map.attributionControl.setPrefix(false);
  L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION }).addTo(map);
  return map;
}

/** ปัดเศษพิกัดเพื่อความเป็นส่วนตัว (2 ตำแหน่ง ≈ 1 กม. | 3 ตำแหน่ง ≈ 100 ม.) */
export function roundLatLng(p: LatLng, digits: number): LatLng {
  const f = 10 ** digits;
  return { lat: Math.round(p.lat * f) / f, lng: Math.round(p.lng * f) / f };
}

export function radiusBounds(L: LeafletNS, center: LatLng, radiusKm: number) {
  return L.latLng(center.lat, center.lng).toBounds(radiusKm * 2000);
}
