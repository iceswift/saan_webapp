import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ลิงก์ข้อความแบบมีรายละเอียด: ตัวอักษรชัด + ลูกศรที่ขยับเมื่อโฮเวอร์ + เส้นใต้ที่ลากออกจากซ้ายไปขวา
 * ใช้กับ "ดูทั้งหมด" และลิงก์นำไปหน้าอื่นท้ายหัวข้อ (สูงอย่างน้อย 44px บนมือถือ)
 */
export function TextLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("group/link inline-flex min-h-11 items-center gap-1.5 text-base font-medium lg:min-h-9", className)}
    >
      <span className="link-draw">{children}</span>
      <ArrowRight
        aria-hidden="true"
        className="size-4 transition-transform duration-200 ease-soft group-hover/link:translate-x-1"
      />
    </Link>
  );
}
