import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { countUnreadNotifications } from "@/server/queries";

/** ปุ่มกระดิ่งแบบไม่ดึงข้อมูล รับจำนวนที่ยังไม่อ่านมาจากข้างนอก (ใช้ใน SiteHeader) */
export function BellLink({ unread, className }: { unread: number; className?: string }) {
  return (
    <Link
      href="/notifications"
      aria-label={unread > 0 ? `การแจ้งเตือน ยังไม่อ่าน ${unread} รายการ` : "การแจ้งเตือน"}
      className={cn(
        "relative flex size-11 items-center justify-center rounded-full border border-foreground/20 bg-background text-foreground transition-[transform,background-color] hover:bg-muted active:scale-95",
        className,
      )}
    >
      <Bell className="size-5" strokeWidth={2} />
      {unread > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-medium text-destructive-foreground ring-2 ring-background">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}

/**
 * ปุ่มกระดิ่งพร้อมจำนวนที่ยังไม่อ่าน วางในส่วนหัวของหน้าหลัก (server component)
 * แสดงเฉพาะมือถือและแท็บเล็ต เพราะเดสก์ท็อปมีกระดิ่งใน SiteHeader อยู่แล้ว
 */
export async function NotificationBell({ userId }: { userId: string }) {
  const unread = await countUnreadNotifications(userId);
  return <BellLink unread={unread} className="lg:hidden" />;
}
