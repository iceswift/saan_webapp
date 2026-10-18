import { LinkButton } from "@/components/link-button";

/** Refunds run through the durable finance operation workflow. */
export function RefundConfirm({ compact = false }: { orderId: string; compact?: boolean }) {
  return <LinkButton href="/admin/finance" variant="outline" size="xl" className={compact ? "px-4" : "w-full"}>
    จัดการคืนเงิน
  </LinkButton>;
}
