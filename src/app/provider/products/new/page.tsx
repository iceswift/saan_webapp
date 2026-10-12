import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth";
import { loadProviderNavBadges } from "../../nav-data";
import { getMyProvider } from "@/server/queries";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "เพิ่มศาลที่ขาย" };

export default async function NewProductPage() {
  const user = await requireUser("/provider/products/new");
  const provider = await getMyProvider(user.id);
  if (!provider) redirect("/provider");

  const navBadges = await loadProviderNavBadges(provider);
  return <ProductForm product={null} title="เพิ่มศาลที่ขาย" navBadges={navBadges} />;
}
