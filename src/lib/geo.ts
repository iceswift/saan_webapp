// ฟังก์ชันตำแหน่งที่ใช้ได้ทั้งฝั่งเซิร์ฟเวอร์และเบราว์เซอร์

export type LatLng = { lat: number; lng: number };

/** ขอบเขตประเทศไทยโดยประมาณ ใช้กรองค่าที่ผิดปกติ */
export const THAI_BOUNDS = { minLat: 5.5, maxLat: 20.6, minLng: 97.3, maxLng: 105.7 } as const;

/** กรุงเทพฯ ใช้เป็นตำแหน่งเริ่มต้นของแผนที่เมื่อยังไม่มีข้อมูล */
export const DEFAULT_CENTER: LatLng = { lat: 13.7563, lng: 100.5018 };

export function isInThailand(p: LatLng): boolean {
  return (
    p.lat >= THAI_BOUNDS.minLat &&
    p.lat <= THAI_BOUNDS.maxLat &&
    p.lng >= THAI_BOUNDS.minLng &&
    p.lng <= THAI_BOUNDS.maxLng
  );
}

/** ระยะทางเส้นตรงเป็นกิโลเมตร (haversine) ไม่ใช่ระยะทางถนน */
export function distanceKm(a: LatLng, b: LatLng): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** ข้อความระยะทางสั้นๆ เช่น "ประมาณ 12 กม." */
export function formatDistance(km: number): string {
  if (km < 1) return "ไม่ถึง 1 กม.";
  return `ประมาณ ${Math.round(km)} กม.`;
}

/** ลิงก์เปิดนำทางในแอปแผนที่ของเครื่อง (Google Maps รองรับทุกอุปกรณ์) */
export function mapsLink(p: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
}
