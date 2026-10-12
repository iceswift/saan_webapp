import type { Metadata } from "next";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Rise } from "@/components/rise";
import { requireUser } from "@/server/auth";
import { AccountNav } from "../account-nav";
import { LogoutEverywhere } from "./logout-everywhere";

export const metadata: Metadata = { title: "ความปลอดภัย" };

export default async function SecurityPage() {
  await requireUser("/settings/security");

  return (
    <AppShell side={<AccountNav />}>
      <PageHeader title="ความปลอดภัย" backHref="/settings" />

      <Rise>
        <section className="max-w-xl">
          <h2 className="font-display text-xl font-medium">เข้าสู่ระบบด้วยรหัสยืนยัน</h2>
          <p className="mt-1 text-base text-muted-foreground">
            ใช้รหัสที่ส่งไปทางเบอร์โทร ไม่มีรหัสผ่านให้จำ
          </p>
        </section>

        <section className="mt-10 max-w-xl border-t border-border pt-8">
          <h2 className="font-display text-xl font-medium">ออกจากระบบทุกอุปกรณ์</h2>
          <p className="mt-1 mb-5 text-base text-muted-foreground">
            ออกจากทุกเครื่องที่เคยเข้าสู่ระบบ รวมถึงเครื่องนี้
          </p>
          <LogoutEverywhere />
        </section>
      </Rise>
    </AppShell>
  );
}
