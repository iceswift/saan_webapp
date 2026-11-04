import "server-only";
import { z } from "zod";
import { db } from "./db";
import { geoSchema, parseInput, phoneSchema, uploadUrlSchema } from "./action-utils";
import { AREA_CODES, PROVIDER_KIND_CODES } from "@/lib/constants";
import { fail, ok, type ActionResult } from "@/lib/result";
import { readImage } from "./storage";

export const profileSchema = z.object({
  name: z.string().trim().min(2, "กรอกชื่อร้านหรือชื่อผู้ให้บริการ").max(100),
  kind: z.enum(PROVIDER_KIND_CODES, "เลือกประเภทผู้ให้บริการ"),
  description: z.string().trim().max(1000).optional(),
  publicAddress: z.string().trim().max(500, "ที่อยู่ยาวได้ไม่เกิน 500 ตัวอักษร").optional(),
  contactHours: z.string().trim().max(300, "ช่วงเวลาติดต่อยาวได้ไม่เกิน 300 ตัวอักษร").optional(),
  coverUrl: uploadUrlSchema.nullable().optional(),
  phone: phoneSchema,
  areas: z.array(z.enum(AREA_CODES)).min(1, "เลือกพื้นที่ให้บริการอย่างน้อย 1 พื้นที่"),
  /** ตำแหน่งร้านและรัศมีบริการ (ไม่บังคับ ส่ง null เพื่อล้างค่า) */
  base: geoSchema.nullable().optional(),
  serviceRadiusKm: z
    .number("รัศมีต้องเป็นตัวเลข")
    .int("รัศมีต้องเป็นจำนวนเต็ม")
    .min(1, "รัศมีอย่างน้อย 1 กม.")
    .max(500, "รัศมีมากสุด 500 กม.")
    .nullable()
    .optional(),
});

export type ProfileInput = {
  name: string;
  kind: string;
  description?: string;
  publicAddress?: string;
  contactHours?: string;
  coverUrl?: string | null;
  phone: string;
  areas: string[];
  base?: { lat: number; lng: number } | null;
  serviceRadiusKm?: number | null;
};

/** userId must come from the authenticated session, never the client payload. */
export async function updateOwnedProviderProfile(userId: string, input: unknown): Promise<ActionResult> {
  const provider = await db.provider.findUnique({ where: { userId } });
  if (!provider) return fail("กรุณาสมัครเป็นผู้ให้บริการก่อน");
  const parsed = parseInput(profileSchema, input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;
  if (data.coverUrl && data.coverUrl !== provider.coverUrl && !await readImage(data.coverUrl.split("/").at(-1)!)) return fail("ไม่พบรูปที่อัปโหลด กรุณาเลือกรูปอีกครั้ง");
  const point = data.base === undefined ? (provider.baseLat !== null && provider.baseLng !== null) : data.base !== null;
  if (data.serviceRadiusKm != null && !point) return fail("ปักหมุดที่ตั้งร้านก่อน จึงจะกำหนดรัศมีได้");
  await db.provider.update({ where: { id: provider.id }, data: {
    name: data.name, kind: data.kind, description: data.description ?? "", phone: data.phone,
    areas: JSON.stringify([...new Set(data.areas)]),
    ...(data.publicAddress !== undefined ? { publicAddress: data.publicAddress } : {}),
    ...(data.contactHours !== undefined ? { contactHours: data.contactHours } : {}),
    ...(data.coverUrl !== undefined ? { coverUrl: data.coverUrl } : {}),
    ...(data.base !== undefined ? { baseLat: data.base?.lat ?? null, baseLng: data.base?.lng ?? null } : {}),
    ...(data.base === null ? { serviceRadiusKm: null } : data.serviceRadiusKm !== undefined ? { serviceRadiusKm: data.serviceRadiusKm } : {}),
  } });
  return ok();
}
