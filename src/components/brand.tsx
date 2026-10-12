import { cn } from "@/lib/utils";

/**
 * ซุ้มประตูศาล: เครื่องหมายประจำตัวของ Saan
 * หลังคาศาลสองชั้นปลายงอน (เส้นสีหมึก) เหนือช่องประตูโค้งที่ "จุดไฟไว้" (สีชาด) วาดเป็นเส้นหนาเท่ากันทั้งภาพ
 * ใช้สีผ่าน token เท่านั้น: เส้นเป็น currentColor (ตามตัวอักษร) ซุ้มเป็น --gold จึงเปลี่ยนตามธีมสว่าง/มืดเอง
 * คมที่ 24px ขึ้นไป (ที่ต่ำกว่านั้นใช้ variant="solid" ซึ่งตัดรายละเอียดเหลือหลังคาชั้นเดียว)
 */
export function ArchMark({
  className,
  variant = "full",
  title,
}: {
  className?: string;
  /** "full" = หลังคาสองชั้น | "solid" = หลังคาชั้นเดียว สำหรับขนาดเล็กมาก (16px) */
  variant?: "full" | "solid";
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-6 shrink-0", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {variant === "full" ? (
        <>
          <path d="M16 2.5V5" />
          <path d="M16 5C15.4 8.2 12.8 9.8 7.5 10.6M16 5C16.6 8.2 19.2 9.8 24.5 10.6" />
          <path d="M16 11C15 15.2 11 17.2 3.5 18M16 11C17 15.2 21 17.2 28.5 18" />
        </>
      ) : (
        <path d="M16 3C15 10 11 14.5 3.5 17M16 3C17 10 21 14.5 28.5 17" />
      )}
      <path d="M5.5 29.5H26.5" />
      <path
        d="M10.5 29V24.2a5.5 5.5 0 0 1 11 0V29Z"
        className="fill-gold stroke-gold"
        strokeWidth="1"
      />
    </svg>
  );
}

const SIZES = {
  sm: { mark: "size-5", thai: "text-lg", latin: "text-sm", gap: "gap-1.5" },
  md: { mark: "size-7", thai: "text-2xl", latin: "text-base", gap: "gap-2" },
  lg: { mark: "size-10", thai: "text-4xl", latin: "text-xl", gap: "gap-3" },
} as const;

/**
 * ตัวอักษรประจำแบรนด์: ซุ้มประตู + "ศาล" (Prompt ปกติ) + "Saan" (DM Sans ตัวเล็กกว่า สีเทา)
 * ไทยกับละตินอ่านเป็นคำเดียวกัน (ศาล = Saan) จึงวางต่อกันเป็นหนึ่งเครื่องหมาย ไม่ใช่สองโลโก้
 * ใช้ที่: ส่วนหัวมือถือ (หน้าแรก) ส่วนหัวเดสก์ท็อป ส่วนท้าย หน้าเข้าสู่ระบบ
 * - size: sm (24px สูง) | md (ส่วนหัว) | lg (หน้าเข้าสู่ระบบ)
 * - latin: false = ซ่อน "Saan" (ใช้เมื่อที่แคบมาก)
 */
export function Wordmark({
  size = "md",
  latin = true,
  className,
}: {
  size?: keyof typeof SIZES;
  latin?: boolean;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <span className={cn("inline-flex items-center text-foreground", s.gap, className)}>
      <ArchMark className={s.mark} variant={size === "sm" ? "solid" : "full"} />
      <span className={cn("font-display leading-none font-normal", s.thai)}>
        <span className="sr-only">Saan </span>
        <span aria-hidden="true">ศาล</span>
      </span>
      {latin ? (
        <span
          aria-hidden="true"
          className={cn("font-sans font-normal text-muted-foreground", s.latin)}
        >
          Saan
        </span>
      ) : null}
    </span>
  );
}
