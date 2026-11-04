import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Wordmark } from "@/components/brand";
import { LinkButton } from "@/components/link-button";
import { Rise } from "@/components/rise";
import { ShrineArt } from "@/components/visuals";
import { getCurrentUser } from "@/server/auth";
import { safeLoginNext } from "./safe-next";
import { LoginForm } from "./login-form";
import { isStagingTestMode, stagingPhones } from "@/server/runtime-policy";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const next = safeLoginNext((await searchParams).next);
  const user = await getCurrentUser();
  if (user && user.name) redirect(next);

  return (
    <AppShell>
      {/* เดสก์ท็อป: ซ้ายเป็นซุ้มโค้งและชื่อแบรนด์ ขวาเป็นฟอร์ม มือถือเรียงบนลงล่าง */}
      <div className="lg:mx-auto lg:grid lg:min-h-[calc(100dvh-var(--site-header-h)-16rem)] lg:max-w-4xl lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] lg:items-center lg:gap-16">
        <Rise>
          <div className="flex flex-col items-center pt-2 text-center">
            <div
              aria-hidden="true"
              style={{ "--arch-r": "5.5rem" } as React.CSSProperties}
              className="arch-top flex h-44 w-44 items-end justify-center overflow-hidden bg-muted pb-1 lg:h-60 lg:w-56"
            >
              <ShrineArt className="size-36 lg:size-48" />
            </div>
            <Wordmark size="lg" className="mt-5" />
            <h1 className="mt-5 font-display text-[1.75rem] leading-[1.3] font-normal lg:text-[2.25rem]">
              เข้าสู่ระบบ
            </h1>
            <p className="mt-1 text-base text-muted-foreground">ใช้เบอร์โทรของคุณ ไม่ต้องจำรหัสผ่าน</p>
          </div>
        </Rise>
        <div>
          <Rise i={2}>
            <div className="mt-8 lg:mt-0">
              <LoginForm next={next} needsNameOnly={Boolean(user && !user.name)} testMode={isStagingTestMode()} />
              {isStagingTestMode() ? <p className="mt-4 text-sm text-muted-foreground">บัญชีทดสอบ: {stagingPhones().join(" · ")} รหัสทดสอบจะแสดงหลังขอรหัส ไม่ได้ส่ง SMS</p> : null}
            </div>
          </Rise>
          <div className="mt-4 flex justify-center">
            <LinkButton href="/" variant="ghost" className="text-muted-foreground">
              ดูหน้าแรกก่อน
            </LinkButton>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
