import { AppShell } from "@/components/app-shell";
import { LinkButton } from "@/components/link-button";
import { EmptyState } from "@/components/visuals";

export default function NotFound() {
  return (
    <AppShell width="narrow">
      <div className="pt-10 lg:flex lg:min-h-[calc(100dvh-var(--site-header-h)-14rem)] lg:items-center lg:justify-center lg:pt-0">
        <EmptyState
          art="search"
          title="ไม่พบหน้านี้"
          description="ลิงก์อาจไม่ถูกต้อง หรือรายการนี้ถูกลบไปแล้ว"
          action={<LinkButton href="/">กลับหน้าแรก</LinkButton>}
        />
      </div>
    </AppShell>
  );
}
