"use client";

import { X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * แผ่นเลื่อนขึ้นจากด้านล่าง (บนเดสก์ท็อป lg ขึ้นไปเป็นกล่องโต้ตอบกลางจอ) ใช้แสดงรายละเอียดเพิ่มโดยไม่ต้องเปลี่ยนหน้า
 * - trigger: เนื้อหาของปุ่มเปิด (ใส่ triggerClassName เพื่อทำให้เป็นการ์ดหรือปุ่ม) ไม่ใส่ได้ถ้าคุมด้วย open/onOpenChange เอง
 * - children: เนื้อหาในแผ่น ใส่ปุ่มหลักได้ 1 ปุ่ม ปุ่มปิดมีให้แล้ว
 * - open / onOpenChange: ควบคุมจากภายนอก (เช่น ปฏิทินที่ปิดเองเมื่อเลือกวัน)
 * - stagger: เนื้อหาย่อยโผล่ขึ้นทีละกลุ่มตอนเปิด (ใส่ style={{"--i": n}} ที่ลูกเพื่อกำหนดลำดับ)
 * - tall: แผ่นสูงเกือบเต็มจอบนมือถือ (ใช้กับช่องค้นหา) เนื้อหาในแผ่นยืดเต็มและเลื่อนเองได้ (ลูกควรมี min-h-0 + overflow เอง)
 * - initialFocus: ref ของช่องที่ควรได้โฟกัสตอนเปิด (ค่าเริ่มต้นคือปุ่มแรกในแผ่น = ปุ่มปิด)
 */
export function BottomSheet({
  trigger,
  triggerClassName,
  triggerLabel,
  title,
  description,
  children,
  open,
  onOpenChange,
  stagger = false,
  tall = false,
  initialFocus,
}: {
  trigger?: React.ReactNode;
  triggerClassName?: string;
  /** ชื่อปุ่มสำหรับโปรแกรมอ่านหน้าจอเมื่อ trigger เป็นไอคอน */
  triggerLabel?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  stagger?: boolean;
  tall?: boolean;
  initialFocus?: React.RefObject<HTMLElement | null>;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <SheetTrigger
          aria-label={triggerLabel}
          className={cn("text-left outline-none", triggerClassName)}
        >
          {trigger}
        </SheetTrigger>
      ) : null}
      <SheetContent
        side="bottom"
        showCloseButton={false}
        initialFocus={initialFocus}
        className={cn(
          tall
            ? "mx-auto max-h-[94dvh] max-w-md gap-0 data-[side=bottom]:h-[94dvh] max-lg:overflow-hidden"
            : "mx-auto max-h-[88dvh] max-w-md gap-0 overflow-y-auto",
          "rounded-t-3xl border-t border-border px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]",
          // เดสก์ท็อป: กลายเป็นกล่องโต้ตอบกลางจอ (จัดกึ่งกลางด้วย inset-0 + m-auto ไม่ใช้ translate จึงไม่ชนกับแอนิเมชัน)
          "lg:data-[side=bottom]:inset-0 lg:data-[side=bottom]:h-fit lg:data-[side=bottom]:max-h-[85dvh] lg:data-[side=bottom]:w-full lg:data-[side=bottom]:max-w-lg lg:data-[side=bottom]:overflow-y-auto lg:data-[side=bottom]:rounded-3xl lg:data-[side=bottom]:border lg:data-[side=bottom]:p-7 lg:data-[side=bottom]:m-auto",
        )}
      >
        <span aria-hidden="true" className="mx-auto mb-4 h-1.5 w-11 rounded-full bg-input lg:hidden" />
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <SheetTitle className="font-display text-xl font-normal">{title}</SheetTitle>
            {description ? (
              <SheetDescription className="mt-1 text-base">{description}</SheetDescription>
            ) : null}
          </div>
          <SheetClose
            aria-label="ปิด"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-foreground/20 text-foreground transition-transform hover:bg-muted active:scale-90"
          >
            <X className="size-5" />
          </SheetClose>
        </div>
        {children ? (
          <div className={cn("mt-5 flex flex-col gap-4", tall && "min-h-0 flex-1", stagger && "sheet-stagger")}>
            {children}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

/** ปุ่มปิดแผ่นที่ทำเป็นปุ่มหลักได้ (ใส่ className ของ buttonVariants) ใช้เป็น "ดูผลลัพธ์" ท้ายแผ่นตัวกรอง */
export { SheetClose as BottomSheetClose };
