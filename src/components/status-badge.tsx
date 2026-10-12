import { cn } from "@/lib/utils";
import {
  ORDER_STATUS,
  PROVIDER_STATUS,
  REQUEST_STATUS,
  VOW_STATUS,
  type OrderStatus,
  type ProviderStatus,
  type RequestStatus,
  type VowStatus,
} from "@/lib/constants";

const tones = {
  neutral: "bg-muted text-muted-foreground",
  wait: "bg-tint-amber text-tint-amber-ink",
  info: "bg-tint-sky text-tint-sky-ink",
  good: "bg-tint-mint text-tint-mint-ink",
  bad: "bg-tint-rose text-tint-rose-ink",
} as const;
export type Tone = keyof typeof tones;

/**
 * ป้ายสถานะทรงแคปซูล สีอ่อนมีเส้นขอบบางสีเดียวกับตัวอักษร ใช้ได้ทั้งสองธีม
 * tone: neutral รอ/ปิด | wait รอดำเนินการ | info กำลังดำเนินการ | good สำเร็จ | bad ยกเลิก/ปฏิเสธ
 */
export function TonePill({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 w-fit items-center gap-1.5 rounded-full px-3 text-sm font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
const Pill = TonePill;

const orderTone: Record<OrderStatus, Tone> = {
  AWAITING_DEPOSIT: "wait",
  AWAITING_PROVIDER: "wait",
  CONFIRMED: "info",
  DONE: "info",
  COMPLETED: "good",
  CANCELLED: "bad",
};

const requestTone: Record<RequestStatus, Tone> = {
  OPEN: "wait",
  ACCEPTED: "good",
  CLOSED: "neutral",
};

const vowTone: Record<VowStatus, Tone> = {
  WAITING: "neutral",
  GRANTED: "wait",
  FULFILLED: "good",
};

const providerTone: Record<ProviderStatus, Tone> = {
  PENDING: "wait",
  VERIFIED: "good",
  REJECTED: "bad",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Pill tone={orderTone[status]}>{ORDER_STATUS[status]}</Pill>;
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <Pill tone={requestTone[status]}>{REQUEST_STATUS[status]}</Pill>;
}

export function VowStatusBadge({ status }: { status: VowStatus }) {
  return <Pill tone={vowTone[status]}>{VOW_STATUS[status]}</Pill>;
}

export function ProviderStatusBadge({ status }: { status: ProviderStatus }) {
  return <Pill tone={providerTone[status]}>{PROVIDER_STATUS[status]}</Pill>;
}
