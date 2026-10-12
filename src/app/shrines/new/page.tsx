import type { Metadata } from "next";
import { requireUser } from "@/server/auth";
import { ShrineForm } from "./shrine-form";

export const metadata: Metadata = { title: "เพิ่มศาลที่มีอยู่" };

export default async function NewShrinePage() {
  await requireUser("/shrines/new");
  return <ShrineForm />;
}
