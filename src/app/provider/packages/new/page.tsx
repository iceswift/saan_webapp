import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth";
import { loadProviderNavBadges } from "../../nav-data";
import { getMyProvider } from "@/server/queries";
import { PackageForm } from "../package-form";

export const metadata: Metadata = { title: "เพิ่มบริการเสริม" };

export default async function NewPackagePage() {
  const user = await requireUser("/provider/packages/new");
  const provider = await getMyProvider(user.id);
  if (!provider) redirect("/provider");

  const navBadges = await loadProviderNavBadges(provider);
  return <PackageForm pkg={null} title="เพิ่มบริการเสริม" navBadges={navBadges} />;
}
