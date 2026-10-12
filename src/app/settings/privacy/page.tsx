import type { Metadata } from "next";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ListGroup, ListRow } from "@/components/list-group";
import { Rise } from "@/components/rise";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/auth";
import { AccountNav } from "../account-nav";
import { DeleteAccountForm } from "./delete-account-form";

export const metadata: Metadata = { title: "ความเป็นส่วนตัวและข้อมูลของฉัน" };

export default async function PrivacyPage() {
  await requireUser("/settings/privacy");

  return (
    <AppShell side={<AccountNav />}>
      <PageHeader title="ความเป็นส่วนตัวและข้อมูลของฉัน" backHref="/settings" />

      <Rise>
        <section className="max-w-xl">
          <h2 className="font-display text-xl font-medium">ดาวน์โหลดข้อมูลของฉัน</h2>
          <p className="mt-1 mb-5 text-base text-muted-foreground">
            ไฟล์รวมโปรไฟล์ ที่อยู่ ศาล สมุดบน และประวัติคำสั่งซื้อของคุณ
          </p>
          <a
            href="/api/me/export"
            download
            className={cn(buttonVariants({ variant: "outline", size: "xl" }), "w-full lg:w-auto")}
          >
            ดาวน์โหลดไฟล์ข้อมูล
          </a>
        </section>

        <div className="mt-10 max-w-xl">
          <ListGroup label="นโยบาย">
            <ListRow href="/legal/privacy" title="นโยบายความเป็นส่วนตัว" />
          </ListGroup>
          <p className="mt-3 px-1 text-sm text-muted-foreground">
            สมุดบนเห็นได้เฉพาะคุณ ร้านและทีมงานมองไม่เห็น
          </p>
        </div>

        <section className="mt-12 max-w-xl border-t border-border pt-8">
          <h2 className="font-display text-xl font-medium">ลบบัญชี</h2>
          <p className="mt-1 text-base">
            ชื่อ เบอร์โทร ที่อยู่ ศาลของฉัน สมุดบน และการแจ้งเตือนจะถูกลบถาวร
            ประวัติคำสั่งซื้อที่เสร็จแล้วจะถูกเก็บแบบไม่ระบุตัวตนเพื่อบัญชีของร้าน
          </p>
          <p className="mt-2 mb-5 text-base text-muted-foreground">
            ย้อนกลับไม่ได้ และลบไม่ได้ถ้ายังมีงานที่กำลังดำเนินการ
          </p>
          <DeleteAccountForm />
        </section>
      </Rise>
    </AppShell>
  );
}
