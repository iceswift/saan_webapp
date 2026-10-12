import type { Metadata } from "next";
import { NewWizard } from "./new-wizard";

export const metadata: Metadata = { title: "ตั้งศาลใหม่" };

export default function NewPage() {
  return <NewWizard />;
}
