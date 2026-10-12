"use client";

import { AppShell } from "@/components/app-shell";
import { LinkButton } from "@/components/link-button";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/visuals";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell width="narrow">
      <div className="pt-10 lg:flex lg:min-h-[calc(100dvh-var(--site-header-h)-14rem)] lg:items-center lg:justify-center lg:pt-0">
        <EmptyState
          art="lotus"
          title="เกิดข้อผิดพลาด"
          description="ระบบทำรายการนี้ไม่สำเร็จ ลองใหม่อีกครั้ง หรือกลับไปหน้าแรก"
          action={
            <div className="flex flex-col gap-3 lg:flex-row lg:justify-center">
              <Button size="xl" onClick={reset}>
                ลองใหม่
              </Button>
              <LinkButton href="/" variant="outline">
                กลับหน้าแรก
              </LinkButton>
            </div>
          }
        />
      </div>
    </AppShell>
  );
}
