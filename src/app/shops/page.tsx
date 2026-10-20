import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { listDirectoryShops } from "@/server/shop-directory";
import { ShopDirectory } from "./shop-directory";
export const metadata: Metadata = { title: "แผนที่ร้านและผู้ให้บริการ" };
export default async function ShopsPage() {
  return <AppShell nav width="full">
    <ShopDirectory shops={await listDirectoryShops()} />
  </AppShell>;
}
