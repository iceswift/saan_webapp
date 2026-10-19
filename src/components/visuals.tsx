import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShrineKind } from "@/lib/constants";
import { Art, type ArtName } from "./illustrations";
import { ShrineScene } from "./shrine-art";

export { ShrineArt, GarlandArt, LotusArt, BellArt, SearchArt } from "./illustrations";
export { ServiceArt, KindArt, ShrineScene } from "./shrine-art";
export { ThumbArt } from "./thumb-art";
export type { ServiceArtName } from "./shrine-art";
export type { ArtName } from "./illustrations";

/*
 * พื้นของไอคอน: ดีไซน์แบนใช้ "เบจกลาง + ไอคอนดำ" ทุกชุดสี (ชื่อ mint/amber/rose/sky/violet ยังรับได้ แต่ไม่ให้สี)
 * เฉพาะ gold (สีชาดอ่อน + ไอคอนสีชาด) ใช้เมื่อต้องการเน้นจริง ๆ ไม่เกิน 1-2 ไอคอนต่อหน้า
 */
const NEUTRAL = "bg-muted text-foreground";
const tints = {
  mint: NEUTRAL,
  amber: NEUTRAL,
  rose: NEUTRAL,
  sky: NEUTRAL,
  violet: NEUTRAL,
  neutral: NEUTRAL,
  gold: "bg-gold-soft text-gold-ink",
} as const;
/** ชุดสีที่เคยใช้วนในกลุ่มรายการ (ตอนนี้ไม่มีผลต่อสี แต่ยังต้องส่งเพื่อความเข้ากันได้) */
export type Tint = "mint" | "amber" | "rose" | "sky" | "violet";
export type TileTint = keyof typeof tints;

/** ไอคอนบนพื้นเบจ ใช้นำหน้าเมนู การ์ด และรายการ เพื่อไม่ให้หน้าจอมีแต่ตัวอักษร */
export function IconTile({
  icon: Icon,
  tint = "mint",
  size = "md",
  className,
}: {
  icon: LucideIcon;
  tint?: TileTint;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center",
        tints[tint],
        size === "sm" && "size-10 rounded-full [&>svg]:size-5",
        size === "md" && "size-12 rounded-full [&>svg]:size-6",
        size === "lg" && "size-16 rounded-full [&>svg]:size-8",
        className,
      )}
    >
      <Icon strokeWidth={1.6} />
    </span>
  );
}

/** วงกลมอักษรย่อ ใช้แทนรูปโปรไฟล์ */
export function Monogram({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initial = Array.from(name.trim())[0];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-border bg-background font-display font-normal text-foreground",
        size === "sm" && "size-10 text-lg",
        size === "md" && "size-14 text-2xl",
        size === "lg" && "size-20 text-3xl",
        className,
      )}
    >
      {initial ?? "S"}
    </span>
  );
}

/** หน้าว่างพร้อมภาพประกอบ ใช้เมื่อยังไม่มีข้อมูลในรายการ ควรมีปุ่มทางไปต่อเสมอ */
export function EmptyState({
  art = "shrine",
  title,
  description,
  action,
}: {
  art?: ArtName;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rise flex flex-col items-center px-4 py-10 text-center">
      {/* ภาพประกอบอยู่ในกรอบซุ้มโค้งแบบประตูศาล (รูปทรงเดียวกับโลโก้) */}
      <div
        aria-hidden="true"
        style={{ "--arch-r": "5.5rem" } as React.CSSProperties}
        className="arch-top flex h-48 w-44 items-end justify-center overflow-hidden bg-muted pb-2"
      >
        <Art name={art} className="size-36" />
      </div>
      <h2 className="mt-3 font-display text-xl font-normal text-balance">{title}</h2>
      {description ? (
        <p className="mt-1.5 max-w-xs text-base text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

/**
 * รูปสินค้าหรือรูปศาล: มีรูปถ่ายใช้รูปถ่าย ไม่มีก็แสดงฉากศาลตามประเภท (kind) และเปลี่ยนโทนตาม seed (รหัสสินค้า)
 * ใส่ group/card ที่การ์ดแม่เพื่อให้รูปขยายเบา ๆ ตอนโฮเวอร์ (อยู่ในกรอบที่ตัดขอบไว้)
 * - arch: ยอดโค้งแบบซุ้มประตูศาล (ใช้กับรูปหลักหน้าสินค้า ไม่ใช้กับการ์ดรายการ) ต้องกว้างกว่า 14rem จึงจะโค้งเต็ม
 * - flush: ไม่มีมุมมนของตัวรูปเอง (ใช้เมื่อการ์ดแม่ตัดมุมให้แล้ว รูปชิดขอบการ์ด)
 * - showCaption: ป้าย "ภาพประกอบ" มุมล่าง เฉพาะเมื่อเป็นภาพวาด (ไม่มี src) ใช้กับรูปใหญ่ เพื่อไม่ให้เข้าใจว่าเป็นรูปถ่ายสินค้า
 */
export function ShrineImage({
  src,
  alt,
  className,
  kind = "PHRA_PHUM",
  seed,
  arch = false,
  flush = false,
  showCaption = false,
}: {
  src: string | null;
  alt: string;
  className?: string;
  kind?: ShrineKind;
  seed?: string;
  arch?: boolean;
  flush?: boolean;
  showCaption?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted",
        flush ? "rounded-none" : "rounded-lg",
        arch && "arch-top",
        className,
      )}
    >
      <div className="size-full transition-transform duration-500 ease-soft group-hover/card:scale-[1.04]">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="size-full object-cover" />
        ) : (
          <ShrineScene kind={kind} seed={seed ?? alt} />
        )}
      </div>
      {!src && showCaption ? (
        <span className="absolute bottom-3 left-3 rounded-full border border-border bg-background px-3 py-1 text-sm text-muted-foreground">
          ภาพประกอบ
        </span>
      ) : null}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-foreground/10 ring-inset"
      />
    </div>
  );
}
