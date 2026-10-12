"use client";

import { useState } from "react";

/**
 * ห่อเนื้อหาของแต่ละขั้นในวิซาร์ด: เมื่อ step เปลี่ยน ขั้นใหม่เลื่อนเข้า (ไปหน้า = จากขวา ย้อนกลับ = จากซ้าย) 250ms
 * ไม่มีแอนิเมชันตอนเปิดหน้าครั้งแรก ผู้ใช้ที่ปิดการเคลื่อนไหวเห็นสลับทันที
 * ใช้: <StepSlide step={step}>{step === 0 ? <A/> : <B/>}</StepSlide> (state ของลูกจะรีเซ็ตเมื่อ step เปลี่ยน เพราะ key ตาม step)
 * หมายเหตุ: เป็นแอนิเมชันขาเข้าอย่างเดียว ขาออกไม่มี (ขั้นเก่าถูกแทนที่ทันที เพื่อไม่ให้ฟอร์มสองขั้นซ้อนกัน)
 */
export function StepSlide({
  step,
  children,
  className,
}: {
  step: number;
  children: React.ReactNode;
  className?: string;
}) {
  const [prev, setPrev] = useState(step);
  const [dir, setDir] = useState<"none" | "next" | "back">("none");
  if (prev !== step) {
    setDir(step > prev ? "next" : "back");
    setPrev(step);
  }
  return (
    <div key={step} data-dir={dir} className={className ? `step-slide ${className}` : "step-slide"}>
      {children}
    </div>
  );
}
