import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/server/auth";
import { loadProviderNavBadges } from "../../nav-data";
import { getMyProvider, listProviderProducts } from "@/server/queries";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "แก้ไขศาลที่ขาย" };

export default async function EditProductPage({ params }: PageProps<"/provider/products/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/provider/products/${id}`);
  const provider = await getMyProvider(user.id);
  if (!provider) redirect("/provider");

  const product = (await listProviderProducts(provider.id)).find((p) => p.id === id);
  if (!product) notFound();

  const navBadges = await loadProviderNavBadges(provider);
  return <ProductForm product={product} title="แก้ไขศาลที่ขาย" navBadges={navBadges} />;
}
