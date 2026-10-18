/** Cancellation never implies that money was refunded. All paid rows must be resolved. */
export function cancelledPaymentDetail(payments: readonly { status: string }[]) {
  const returned = payments.some((payment) => payment.status === "REFUNDED");
  const outstanding = payments.some((payment) => payment.status === "PAID");
  if (returned && outstanding) return "คืนเงินแล้วบางส่วน ยังมียอดรอตรวจสอบ";
  if (returned) return "คืนเงินครบแล้ว";
  if (outstanding) return "มียอดชำระที่ต้องคืน ทีมงานกำลังตรวจสอบขั้นตอน ยังไม่ได้คืนเงิน";
  return "ดูเบอร์ติดต่อร้านได้ในรายละเอียด";
}
