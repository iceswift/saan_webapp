// ชุดค่าที่ใช้ร่วมกันทั้งฝั่งเซิร์ฟเวอร์และหน้าจอ
// ฐานข้อมูลเก็บเป็นรหัส (key) หน้าจอแสดงด้วย label

export const AREAS = {
  BKK: "กรุงเทพมหานคร",
  NBI: "นนทบุรี",
  PTE: "ปทุมธานี",
  SPK: "สมุทรปราการ",
} as const;
export type AreaCode = keyof typeof AREAS;
export const AREA_CODES = Object.keys(AREAS) as [AreaCode, ...AreaCode[]];

export const SHRINE_KINDS = {
  PHRA_PHUM: "ศาลพระภูมิ",
  CHAO_THI: "ศาลเจ้าที่ (ศาลตายาย)",
  PAIR: "ชุดคู่ ศาลพระภูมิและศาลเจ้าที่",
  PHRA_PHROM: "ศาลพระพรหม",
  MODERN: "ศาลโมเดิร์น",
} as const;
export type ShrineKind = keyof typeof SHRINE_KINDS;
export const SHRINE_KIND_CODES = Object.keys(SHRINE_KINDS) as [ShrineKind, ...ShrineKind[]];

export const PLACE_TYPES = {
  HOME: "บ้านพักอาศัย",
  SHOP: "ร้านค้าหรือสำนักงาน",
  FACTORY: "โรงงานหรือโกดัง",
  ESTATE: "หมู่บ้านหรืออาคารชุด",
} as const;
export type PlaceType = keyof typeof PLACE_TYPES;
export const PLACE_TYPE_CODES = Object.keys(PLACE_TYPES) as [PlaceType, ...PlaceType[]];

export const PACKAGE_TYPES = {
  CEREMONY: "พิธีตั้งศาล",
  OFFERINGS: "เครื่องสังเวยและของถวาย",
  BASE: "ทำฐานศาล",
  REMOVE_OLD: "ถอนและรับศาลเก่า",
} as const;
export type PackageType = keyof typeof PACKAGE_TYPES;
export const PACKAGE_TYPE_CODES = Object.keys(PACKAGE_TYPES) as [PackageType, ...PackageType[]];

export const PROVIDER_KINDS = {
  SHOP: "ร้านหรือโรงงานศาล",
  BRAHMIN: "พราหมณ์หรือผู้ประกอบพิธี",
  TECHNICIAN: "ช่างซ่อมและทำฐาน",
  CARETAKER: "ผู้ดูแลประจำ",
} as const;
export type ProviderKind = keyof typeof PROVIDER_KINDS;
export const PROVIDER_KIND_CODES = Object.keys(PROVIDER_KINDS) as [ProviderKind, ...ProviderKind[]];

export const PROVIDER_STATUS = {
  PENDING: "รอตรวจสอบ",
  VERIFIED: "ตรวจสอบแล้ว",
  REJECTED: "ไม่ผ่านการตรวจสอบ",
} as const;
export type ProviderStatus = keyof typeof PROVIDER_STATUS;

export const ORDER_TYPES = {
  INSTALL: "ตั้งศาลใหม่",
  REMOVE: "ถอน ย้าย รับศาลเก่า",
  REPAIR: "ซ่อมและบูรณะ",
} as const;
export type OrderType = keyof typeof ORDER_TYPES;

export const ORDER_STATUS = {
  AWAITING_DEPOSIT: "รอจ่ายมัดจำ",
  AWAITING_PROVIDER: "รอร้านยืนยัน",
  CONFIRMED: "ร้านยืนยันแล้ว",
  DONE: "งานเสร็จ รอตรวจรับ",
  COMPLETED: "เสร็จสมบูรณ์",
  CANCELLED: "ยกเลิก",
} as const;
export type OrderStatus = keyof typeof ORDER_STATUS;

export const REQUEST_TYPES = {
  REMOVE: "ถอน ย้าย รับศาลเก่า",
  REPAIR: "ซ่อมและบูรณะ",
} as const;
export type RequestType = keyof typeof REQUEST_TYPES;

export const REQUEST_STATUS = {
  OPEN: "รอใบเสนอราคา",
  ACCEPTED: "เลือกร้านแล้ว",
  CLOSED: "ปิดคำขอ",
} as const;
export type RequestStatus = keyof typeof REQUEST_STATUS;

export const VOW_STATUS = {
  WAITING: "รอผล",
  GRANTED: "สมหวังแล้ว รอแก้บน",
  FULFILLED: "แก้บนแล้ว",
} as const;
export type VowStatus = keyof typeof VOW_STATUS;

export const PAYMENT_METHODS = {
  PROMPTPAY: "พร้อมเพย์ QR",
  CARD: "บัตรเครดิตหรือเดบิต",
} as const;
export type PaymentMethod = keyof typeof PAYMENT_METHODS;

export const ROLES = {
  CUSTOMER: "ลูกค้า",
  PROVIDER: "ผู้ให้บริการ",
  ADMIN: "ผู้ดูแลระบบ",
} as const;
export type Role = keyof typeof ROLES;

// สัดส่วนมัดจำของยอดรวม ยังเป็นค่าสมมติ รอการตัดสินใจทางธุรกิจ
export const DEPOSIT_RATE = 0.3;

export const PAYMENT_STATUS = {
  PENDING: "รอชำระ",
  PAID: "ชำระแล้ว",
  FAILED: "ไม่สำเร็จ",
  REFUNDED: "คืนเงินแล้ว",
} as const;

export const NOTIFICATION_KINDS = {
  ORDER: "คำสั่งซื้อและงาน",
  QUOTE: "ใบเสนอราคา",
  VOW: "สมุดบน",
  SYSTEM: "ระบบ",
} as const;

// ช่องทางติดต่อทีมงาน เว้นว่างไว้จนกว่าจะมีช่องทางจริง หน้าช่วยเหลือจะแสดงเฉพาะรายการที่กรอกแล้ว
export const SUPPORT = {
  email: "",
  line: "",
  phone: "",
} as const;
