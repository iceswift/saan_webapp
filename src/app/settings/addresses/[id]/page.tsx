import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth";
import { listAddresses } from "@/server/queries";
import { AddressForm } from "../address-form";

export const metadata: Metadata = { title: "แก้ไขที่อยู่" };

export default async function EditAddressPage({
  params,
}: PageProps<"/settings/addresses/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/settings/addresses/${id}`);
  const addresses = await listAddresses(user.id);
  const address = addresses.find((a) => a.id === id);
  if (!address) notFound();

  return <AddressForm initial={address} />;
}
