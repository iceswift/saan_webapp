import Link from "next/link";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** ลิงก์ที่หน้าตาเป็นปุ่ม ใช้แทน <Button> เมื่อกดแล้วไปหน้าอื่น */
export function LinkButton({
  href,
  variant,
  size = "xl",
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
} & VariantProps<typeof buttonVariants>) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)}>
      {children}
    </Link>
  );
}
