import type { Metadata } from "next";
import { requireUser } from "@/server/auth";
import { AddressForm } from "../address-form";

export const metadata: Metadata = { title: "เพิ่มที่อยู่" };

export default async function NewAddressPage() {
  await requireUser("/settings/addresses/new");
  return <AddressForm />;
}
