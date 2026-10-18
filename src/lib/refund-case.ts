export const REFUND_CASE_LABELS: Record<string, string> = {
  NEEDS_DETAILS: "รอข้อมูลผู้รับคืนทดสอบ",
  DETAILS_RECEIVED: "รอตรวจสอบข้อมูลทดสอบ",
  DETAILS_VERIFIED: "ตรวจสอบข้อมูลแล้ว รออนุมัติทดสอบ",
  APPROVED: "อนุมัติแล้ว รอจำลองการส่งเงิน",
  SENT_UNVERIFIED: "จำลองส่งแล้ว รอยืนยันหลักฐานทดสอบ",
  TEST_COMPLETED: "จบขั้นตอนทดสอบ ยังไม่ได้คืนเงินจริง",
};
