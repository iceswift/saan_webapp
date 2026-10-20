import type { Metadata } from "next";
import { AppShell, PageHeader } from "@/components/app-shell";
import { listDirectoryShops } from "@/server/shop-directory";
import { ShopDirectory } from "./shop-directory";
export const metadata: Metadata = { title: "แผนที่ร้านและผู้ให้บริการ" };
export default async function ShopsPage() {
  return <AppShell nav width="full"><PageHeader title="ร้านและผู้ให้บริการ" subtitle="ร้านที่ผ่านการตรวจสอบบน Saan" backHref="/browse" backLabel="เลือกดูศาล" />
    <ShopDirectory shops={await listDirectoryShops()} />
  </AppShell>;
}
