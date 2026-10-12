import { Art } from "@/components/illustrations";
import { cn } from "@/lib/utils";
import type { GuideArticle } from "./content";

/** ปกบทความ: ภาพประกอบเส้นบางบนพื้นเบจ ใช้ทั้งหน้ารายการและหน้าบทความ */
export function GuideCover({
  article,
  className,
  artClassName = "h-4/5",
}: {
  article: GuideArticle;
  className?: string;
  artClassName?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-lg bg-muted",
        className,
      )}
    >
      <Art name={article.art} className={cn("relative aspect-square", artClassName)} />
    </div>
  );
}
