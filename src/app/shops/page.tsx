import type { Metadata } from "next";
import { isStagingTestMode } from "@/server/runtime-policy";
import { listDirectoryShops } from "@/server/shop-directory";
import { ShopDirectory } from "./shop-directory";
export const metadata: Metadata = { title: "แผนที่ร้านและผู้ให้บริการ" };
export default async function ShopsPage() {
  return <main className="shop-map-page">
    <ShopDirectory shops={await listDirectoryShops()} testMode={isStagingTestMode()} />
  </main>;
}
