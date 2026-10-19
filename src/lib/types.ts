// รูปแบบข้อมูลที่หน้าจอได้รับจาก src/server/queries.ts
// วันที่ทุกค่าเป็นสตริง ISO เพื่อส่งต่อให้ client component ได้ทันที

import type {
  AreaCode,
  OrderStatus,
  OrderType,
  PackageType,
  PaymentMethod,
  PlaceType,
  ProviderKind,
  ProviderStatus,
  RequestStatus,
  RequestType,
  Role,
  ShrineKind,
  VowStatus,
} from "./constants";

export type ProviderSummary = {
  id: string;
  name: string;
  kind: ProviderKind;
  status: ProviderStatus;
  description: string;
  phone: string;
  areas: AreaCode[];
  /** คะแนนเฉลี่ย 1-5 หรือ null ถ้ายังไม่มีรีวิว */
  rating: number | null;
  reviewCount: number;
  /** ตำแหน่งร้านที่ร้านตั้งไว้ หรือ null */
  location: { lat: number; lng: number } | null;
  /** รัศมีให้บริการ กม. หรือ null = ไม่จำกัดตามระยะ */
  serviceRadiusKm: number | null;
};

export type PackageDTO = {
  id: string;
  type: PackageType;
  name: string;
  description: string;
  price: number;
  active: boolean;
};

export type ProductDTO = {
  id: string;
  name: string;
  description: string;
  kind: ShrineKind;
  price: number;
  imageUrl: string | null;
  active: boolean;
  provider: ProviderSummary;
  /** ระยะเส้นตรงจากตำแหน่งที่ผู้ใช้ระบุ (ใส่เมื่อค้นหาด้วย near) */
  distanceKm?: number | null;
};

export type ProductDetail = ProductDTO & {
  /** บริการเสริมของร้านเดียวกันที่เปิดขายอยู่ */
  packages: PackageDTO[];
};

export type ShrineDTO = {
  id: string;
  name: string;
  kind: ShrineKind;
  area: AreaCode;
  address: string;
  photoUrl: string | null;
  installedAt: string | null;
  createdAt: string;
};

export type OrderSummary = {
  id: string;
  code: string;
  type: OrderType;
  status: OrderStatus;
  /** ชื่อรายการแรก ใช้เป็นหัวเรื่องของคำสั่ง */
  title: string;
  total: number;
  deposit: number;
  area: AreaCode;
  scheduledAt: string | null;
  createdAt: string;
  providerName: string;
  customerName: string;
  customerPhone: string;
};

export type OrderEventDTO = {
  id: string;
  title: string;
  note: string;
  photoUrl: string | null;
  byRole: Role | "SYSTEM";
  createdAt: string;
};

export type PaymentDTO = {
  id: string;
  kind: "DEPOSIT" | "BALANCE";
  amount: number;
  method: PaymentMethod;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paidAt: string | null;
};

export type ReviewDTO = {
  rating: number;
  comment: string;
  /** รูปงานจริงที่ลูกค้าแนบ */
  photoUrls: string[];
  createdAt: string;
};

export type OrderDetail = OrderSummary & {
  address: string;
  /** ตำแหน่งที่ลูกค้าปักหมุดไว้ หรือ null */
  location: { lat: number; lng: number } | null;
  note: string;
  placeType: PlaceType | "";
  shrineKind: ShrineKind | "";
  /** วันที่ลูกค้าสะดวก รูปแบบ YYYY-MM-DD */
  preferredDates: string[];
  items: { id: string; name: string; price: number }[];
  events: OrderEventDTO[];
  payments: PaymentDTO[];
  review: ReviewDTO | null;
  provider: ProviderSummary;
  /** ยอดที่เหลือต้องจ่ายเมื่อตรวจรับงาน */
  balance: number;
  /** ผู้ที่กำลังดูคำสั่งนี้เกี่ยวข้องในฐานะใด */
  viewerIs: "CUSTOMER" | "PROVIDER" | "ADMIN";
  /** ข้อความระหว่างลูกค้ากับร้าน เรียงจากเก่าไปใหม่ */
  messages: MessageDTO[];
};

export type MessageDTO = {
  id: string;
  body: string;
  /** รูปที่แนบมากับข้อความ */
  photoUrl: string | null;
  createdAt: string;
  /** true เมื่อผู้ที่กำลังดูเป็นคนส่ง */
  mine: boolean;
  senderName: string;
  senderIs: "CUSTOMER" | "PROVIDER" | "ADMIN";
};

export type QuoteDTO = {
  id: string;
  price: number;
  note: string;
  status: "SENT" | "ACCEPTED" | "DECLINED";
  createdAt: string;
  provider: ProviderSummary;
};

export type RequestSummary = {
  id: string;
  type: RequestType;
  status: RequestStatus;
  description: string;
  area: AreaCode;
  address: string;
  location: { lat: number; lng: number } | null;
  photoUrls: string[];
  createdAt: string;
  quoteCount: number;
  /** คำสั่งที่เกิดจากคำขอนี้ หลังลูกค้าเลือกใบเสนอราคาแล้ว */
  orderId: string | null;
  customerName: string;
};

export type RequestDetail = RequestSummary & {
  quotes: QuoteDTO[];
};

/** คำขอที่ผู้ให้บริการเห็น พร้อมใบเสนอราคาของตัวเองถ้าส่งไปแล้ว */
export type ProviderRequest = RequestSummary & {
  myQuote: { price: number; note: string; status: QuoteDTO["status"] } | null;
};

export type VowDTO = {
  id: string;
  place: string;
  location: { lat: number; lng: number } | null;
  wish: string;
  promise: string;
  status: VowStatus;
  /** วันที่ขอให้เตือน หรือ null */
  remindAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminStats = {
  pendingProviders: number;
  verifiedProviders: number;
  activeOrders: number;
  completedOrders: number;
  openRequests: number;
};

export type SettingsDTO = {
  largeText: boolean;
  notifyOrders: boolean;
  notifyQuotes: boolean;
  notifyVows: boolean;
};

export type AddressDTO = {
  id: string;
  label: string;
  area: AreaCode;
  address: string;
  /** ตำแหน่งที่ปักหมุดไว้ หรือ null */
  location: { lat: number; lng: number } | null;
  isDefault: boolean;
};

export type NotificationDTO = {
  id: string;
  kind: "ORDER" | "QUOTE" | "VOW" | "SYSTEM";
  title: string;
  body: string;
  /** ลิงก์ปลายทางเมื่อแตะ หรือสตริงว่าง */
  href: string;
  read: boolean;
  createdAt: string;
};

export type CareLogDTO = {
  id: string;
  title: string;
  note: string;
  photoUrl: string | null;
  doneAt: string;
};

export type ShrineDetail = ShrineDTO & {
  careLogs: CareLogDTO[];
  orders: OrderSummary[];
  requests: RequestSummary[];
};

export type PublicReview = {
  rating: number;
  comment: string;
  photoUrls: string[];
  createdAt: string;
  /** ชื่อลูกค้าแบบย่อ เช่น "คุณส." */
  customerName: string;
};

export type PublicProvider = {
  provider: ProviderSummary;
  products: ProductDTO[];
  packages: PackageDTO[];
  reviews: PublicReview[];
  completedOrders: number;
};

export type RefundItem = OrderSummary & {
  refundAmount: number;
};
