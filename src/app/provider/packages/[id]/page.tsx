import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/server/auth";
import { loadProviderNavBadges } from "../../nav-data";
import { getMyProvider, listProviderPackages } from "@/server/queries";
import { PackageForm } from "../package-form";

export const metadata: Metadata = { title: "แก้ไขบริการเสริม" };

export default async function EditPackagePage({ params }: PageProps<"/provider/packages/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/provider/packages/${id}`);
  const provider = await getMyProvider(user.id);
  if (!provider) redirect("/provider");

  const pkg = (await listProviderPackages(provider.id)).find((p) => p.id === id);
  if (!pkg) notFound();

  const navBadges = await loadProviderNavBadges(provider);
  return <PackageForm pkg={pkg} title="แก้ไขบริการเสริม" navBadges={navBadges} />;
}
