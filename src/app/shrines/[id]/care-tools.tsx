"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { BottomSheet } from "@/components/bottom-sheet";
import { Chip } from "@/components/chip";
import { SoonBadge, SoonButton } from "@/components/coming-soon";
import { SAMPLE_ROUTINE_ACTIVITIES, SAMPLE_ROUTINE_INTERVALS } from "@/lib/mock/me-care-routine";

// UI-ONLY: ตั้งรอบเตือนดูแลและส่งออกรายงานยังไม่มีระบบหลังบ้าน ดู src/lib/mock/me-care-routine.ts

const rowClass =
  "group/row flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-muted";

/** เครื่องมือช่วยดูแลศาลที่ยังไม่เปิดใช้จริง: ทุกแถวบอกตรง ๆ ว่ายังไม่เปิด */
export function CareTools() {
  const [activity, setActivity] = useState<string>(SAMPLE_ROUTINE_ACTIVITIES[0]);
  const [interval, setIntervalDays] = useState<number>(SAMPLE_ROUTINE_INTERVALS[0].days);

  return (
    <ul className="surface flex flex-col divide-y divide-border overflow-hidden" aria-label="ตัวช่วยดูแล">
      <li>
        <BottomSheet
          triggerClassName={rowClass}
          title="ตั้งรอบเตือนดูแล"
          description="เลือกสิ่งที่อยากให้เตือน และความถี่ที่สะดวก"
          trigger={
            <>
              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-base font-medium">ตั้งรอบเตือนดูแล</span>
                <SoonBadge />
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </>
          }
        >
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-base font-medium">เตือนเรื่อง</legend>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_ROUTINE_ACTIVITIES.map((item) => (
                <Chip key={item} active={activity === item} onClick={() => setActivity(item)}>
                  {item}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-base font-medium">ความถี่</legend>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_ROUTINE_INTERVALS.map((item) => (
                <Chip
                  key={item.days}
                  active={interval === item.days}
                  onClick={() => setIntervalDays(item.days)}
                >
                  {item.label}
                </Chip>
              ))}
            </div>
          </fieldset>
          <SoonButton className="w-full" message="รอบเตือนดูแลกำลังจะเปิดใช้ ขอบคุณที่รอ">
            บันทึกรอบเตือน
          </SoonButton>
        </BottomSheet>
      </li>
      <li>
        <button
          type="button"
          className={rowClass}
          onClick={() => toast.info("การส่งออกรายงานกำลังจะเปิดใช้ ขอบคุณที่รอ")}
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-base font-medium">ส่งออกรายงาน</span>
            <SoonBadge />
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </li>
    </ul>
  );
}
