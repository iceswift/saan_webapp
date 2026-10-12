"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { NotificationDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import { markAllNotificationsRead, markNotificationRead } from "@/server/actions/settings";

const timeFmt = new Intl.DateTimeFormat("th-TH", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Bangkok",
});

/** เวลาแบบอ่านง่าย: วันนี้แสดงเวลา เมื่อวาน และ N วันก่อน (daysAgo คำนวณบนเซิร์ฟเวอร์) */
function relativeLabel(createdAt: string, daysAgo: number) {
  if (daysAgo <= 0) return `${timeFmt.format(new Date(createdAt))} น.`;
  if (daysAgo === 1) return "เมื่อวาน";
  return `${daysAgo} วันก่อน`;
}

/**
 * แถวการแจ้งเตือนใน <ListGroup>: จุดสีชาดบอกว่ายังไม่ได้อ่าน ไม่มีไอคอนในวงกลม
 * แตะแล้วทำเครื่องหมายว่าอ่านแล้วและไปยังหน้าที่เกี่ยวข้อง
 */
export function NotificationRow({
  notification,
  daysAgo,
}: {
  notification: NotificationDTO;
  daysAgo: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const unread = !notification.read;

  function open() {
    startTransition(async () => {
      if (unread) {
        const res = await markNotificationRead({ notificationId: notification.id });
        if (!res.ok) toast.error(res.error);
      }
      if (notification.href) router.push(notification.href);
    });
  }

  return (
    <li className="min-w-0">
      <button
        type="button"
        onClick={open}
        disabled={pending}
        className="flex min-h-14 w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-muted active:bg-muted disabled:opacity-70"
      >
        <span aria-hidden="true" className="flex h-6 w-2.5 shrink-0 items-center">
          <span className={cn("size-2.5 rounded-full", unread ? "bg-gold" : "bg-transparent")} />
        </span>
        <span className="min-w-0 flex-1">
          {unread ? <span className="sr-only">ยังไม่ได้อ่าน: </span> : null}
          <span className="block text-base leading-snug font-medium break-words">{notification.title}</span>
          {notification.body ? (
            <span className="mt-0.5 block text-base break-words text-muted-foreground">{notification.body}</span>
          ) : null}
        </span>
        <span className="numeric shrink-0 pt-0.5 text-sm text-muted-foreground">
          {relativeLabel(notification.createdAt, daysAgo)}
        </span>
      </button>
    </li>
  );
}

/** ทำเครื่องหมายทุกรายการว่าอ่านแล้ว แสดงเฉพาะเมื่อมีรายการที่ยังไม่อ่าน */
export function MarkAllReadButton() {
  const [pending, startTransition] = useTransition();

  function markAll() {
    startTransition(async () => {
      const res = await markAllNotificationsRead();
      if (!res.ok) toast.error(res.error);
    });
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className="min-h-11 rounded-full px-4 text-base"
      loading={pending}
      onClick={markAll}
    >
      {pending ? null : <CheckCheck className="size-5" aria-hidden="true" />}
      อ่านทั้งหมด
    </Button>
  );
}
