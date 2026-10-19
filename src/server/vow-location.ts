import "server-only";
import { z } from "zod";
import { db } from "./db";
import { geoSchema, idSchema } from "./action-utils";
import { fail, ok } from "@/lib/result";

export async function saveOwnedVowLocation(userId: string, input: unknown) {
  const parsed = z.object({ vowId: idSchema, location: geoSchema.nullable() }).safeParse(input);
  if (!parsed.success) return fail("พิกัดไม่ถูกต้อง กรุณาเลือกหมุดในประเทศไทย หรือเอาหมุดออก");
  const { vowId, location } = parsed.data;
  const result = await db.vow.updateMany({ where: { id: vowId, userId }, data: {
    lat: location ? Math.round(location.lat * 1e6) / 1e6 : null,
    lng: location ? Math.round(location.lng * 1e6) / 1e6 : null,
  } });
  return result.count === 1 ? ok() : fail("ไม่พบรายการบนหรือไม่มีสิทธิ์แก้ไข");
}
