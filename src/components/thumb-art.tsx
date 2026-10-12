import type { ShrineKind } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { KindArt, ServiceArt, type ServiceArtName } from "./shrine-art";

const SIZES = {
  sm: "size-12",
  md: "size-16",
  lg: "size-20",
} as const;

/**
 * ภาพย่อสี่เหลี่ยมมุมมน พื้นเบจ มีภาพวาดศาล (kind) หรือภาพบริการ (service) อยู่ข้างใน
 * ใช้นำหน้าแถวใน <ListRow> แทนไอคอนในวงกลม เมื่อรายการนั้น "คือ" ศาล งาน หรือบริการ
 * - kind: ประเภทศาล (ShrineKind) | service: ชื่อภาพบริการ (ส่งอย่างใดอย่างหนึ่ง)
 * - src: ถ้ามีรูปถ่ายจริงจะใช้รูปถ่ายแทนภาพวาด
 */
export function ThumbArt({
  kind,
  service,
  src,
  alt = "",
  size = "md",
  className,
}: {
  kind?: ShrineKind;
  service?: ServiceArtName;
  src?: string | null;
  alt?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden={alt ? undefined : "true"}
      className={cn("relative flex shrink-0 items-end justify-center overflow-hidden rounded-lg bg-muted", SIZES[size], className)}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="size-full object-cover" />
      ) : service ? (
        <ServiceArt name={service} className="size-full p-1" />
      ) : (
        <KindArt kind={kind ?? "PHRA_PHUM"} className="size-full p-0.5" />
      )}
    </span>
  );
}
