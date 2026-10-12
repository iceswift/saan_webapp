import { cn } from "@/lib/utils";

/** เส้นคั่นบาง ใส่ label เพื่อมีข้อความกลางเส้น เช่น "หรือ" */
export function Divider({ label, className }: { label?: string; className?: string }) {
  if (!label) {
    return <hr className={cn("border-0 border-t border-border", className)} />;
  }
  return (
    <div className={cn("flex items-center gap-3 text-sm text-muted-foreground", className)} role="separator">
      <span className="h-px flex-1 bg-border" />
      {label}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/** เส้นคั่นช่วงสำคัญของหน้า (เดิมเป็นเส้นประดับ ตอนนี้เป็นเส้นบางเรียบ ๆ ชื่อเดิมคงไว้) */
export function OrnamentDivider({ className }: { className?: string }) {
  return (
    <hr aria-hidden="true" className={cn("border-0 border-t border-border", className)} />
  );
}
