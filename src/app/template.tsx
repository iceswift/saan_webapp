import { ViewTransition } from "react";

/**
 * เปลี่ยนหน้าแบบนุ่ม: template สร้างใหม่ทุกครั้งที่เปลี่ยนเส้นทาง
 * หน้าเก่าจางออกเร็ว ๆ หน้าใหม่จางเข้าพร้อมลอยขึ้นเล็กน้อย (CSS อยู่ใน globals.css: .page-in / .page-out)
 * ใช้ View Transitions API ของเบราว์เซอร์ ถ้าไม่รองรับหรือผู้ใช้ปิดการเคลื่อนไหวก็แค่เปลี่ยนหน้าตามปกติ
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      {children}
    </ViewTransition>
  );
}
