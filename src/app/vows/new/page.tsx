import type { Metadata } from "next";
import { requireUser } from "@/server/auth";
import { VowForm } from "./vow-form";

export const metadata: Metadata = { title: "บันทึกการบนใหม่" };

export default async function NewVowPage() {
  await requireUser("/vows/new");
  // วันเตือนขั้นต่ำคือพรุ่งนี้ตามเวลาไทย
  const now = new Date();
  const minRemindAt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(
    new Date(now.getTime() + 24 * 60 * 60 * 1000),
  );
  return <VowForm minRemindAt={minRemindAt} />;
}
