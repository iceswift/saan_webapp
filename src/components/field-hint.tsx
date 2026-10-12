"use client";

import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ข้อความใต้ช่องกรอก (v6): เงื่อนไขหรือคำอธิบาย (สีเทา) และข้อความผิดพลาดหลังกดปุ่ม (สีแดง มีไอคอน)
 * ห้ามวางข้อความเงื่อนไขสีแดงไว้เหนือหัวข้อ ต้องอยู่ใต้ช่องเสมอ
 *
 * รูปแบบตรวจแบบกดแล้วบอก (แทนปุ่มกดไม่ได้):
 * 1) ปุ่มหลักต้องกดได้เสมอ (ห้าม disabled เพราะข้อมูลยังไม่ครบ)
 * 2) ตอนกด: ถ้าไม่ผ่าน เก็บข้อความต่อช่องไว้ใน state `errors` แล้วเรียก focusFirstInvalid(formRef.current) หลัง render
 * 3) ช่องใส่ aria-invalid={Boolean(errors.x)} aria-describedby="x-hint" และใต้ช่องวาง <FieldHint id="x-hint" error={errors.x}>ข้อความปกติ</FieldHint>
 * 4) ล้างข้อความผิดพลาดของช่องนั้นเมื่อผู้ใช้แก้ไข
 * ตัวอย่างอยู่ใน AGENTS.md หัวข้อ v6
 */
export function FieldHint({
  id,
  error,
  children,
  className,
}: {
  id?: string;
  /** มีค่า = แสดงเป็นข้อความผิดพลาดแทนข้อความปกติ */
  error?: string | null;
  /** ข้อความปกติใต้ช่อง (แสดงเมื่อไม่มี error) */
  children?: React.ReactNode;
  className?: string;
}) {
  if (!error && !children) return null;
  return (
    <p
      id={id}
      role={error ? "alert" : undefined}
      className={cn(
        "mt-2 flex items-start gap-1.5 px-1 text-sm",
        error ? "text-destructive" : "text-muted-foreground",
        className,
      )}
    >
      {error ? <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : null}
      <span>{error ?? children}</span>
    </p>
  );
}

/**
 * เลื่อนและโฟกัสช่องแรกที่ไม่ผ่านการตรวจ (ช่องที่มี aria-invalid="true") ไม่มีแอนิเมชันสั่น
 * เรียกหลัง React วาด error แล้ว เช่น ใน requestAnimationFrame หรือ useEffect ที่ดู errors
 * คืน true ถ้าพบช่อง
 */
export function focusFirstInvalid(root: ParentNode | null | undefined): boolean {
  const el = root?.querySelector<HTMLElement>('[aria-invalid="true"]');
  if (!el) return false;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  el.focus({ preventScroll: true });
  return true;
}
