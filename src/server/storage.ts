import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// เก็บไฟล์ในเครื่องสำหรับพัฒนา เมื่อขึ้นระบบจริงให้เปลี่ยนไปใช้ object storage
// Stable /api/files keys survive moving the data directory or implementing another backend.
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "storage", "uploads");
const MAX_BYTES = 5 * 1024 * 1024;

const TYPES = {
  jpg: { mime: "image/jpeg", magic: [0xff, 0xd8, 0xff] },
  png: { mime: "image/png", magic: [0x89, 0x50, 0x4e, 0x47] },
  webp: { mime: "image/webp", magic: [0x52, 0x49, 0x46, 0x46] },
} as const;
type Ext = keyof typeof TYPES;

const NAME_PATTERN = /^[a-f0-9]{32}\.(jpg|png|webp)$/;

function detect(bytes: Uint8Array): Ext | null {
  for (const ext of Object.keys(TYPES) as Ext[]) {
    if (TYPES[ext].magic.every((b, i) => bytes[i] === b) &&
        (ext !== "webp" || (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50))) return ext;
  }
  return null;
}

/** บันทึกรูป คืน URL สำหรับแสดงผล หรือข้อความผิดพลาด */
export async function saveImage(file: File): Promise<{ url: string } | { error: string }> {
  if (file.size === 0) return { error: "ไฟล์ว่างเปล่า" };
  if (file.size > MAX_BYTES) return { error: "รูปต้องมีขนาดไม่เกิน 5 MB" };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = detect(bytes);
  if (!ext) return { error: "รองรับเฉพาะไฟล์ JPG, PNG และ WebP" };

  const name = `${randomBytes(16).toString("hex")}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), bytes);
  return { url: `/api/files/${name}` };
}

export async function readImage(name: string): Promise<{ bytes: Buffer; mime: string } | null> {
  const match = NAME_PATTERN.exec(name);
  if (!match) return null;
  try {
    const bytes = await readFile(path.join(UPLOAD_DIR, name));
    return { bytes, mime: TYPES[match[1] as Ext].mime };
  } catch {
    return null;
  }
}
