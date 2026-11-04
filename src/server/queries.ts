import "server-only";
import type { Prisma, Provider } from "@prisma/client";
import { db } from "./db";
import { distanceKm } from "@/lib/geo";
import type { CurrentUser } from "./auth";
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
} from "@/lib/constants";
import type {
  AddressDTO,
  AdminStats,
  CareLogDTO,
  NotificationDTO,
  PublicProvider,
  RefundItem,
  SettingsDTO,
  ShrineDetail,
  OrderDetail,
  OrderSummary,
  PackageDTO,
  PaymentDTO,
  ProductDetail,
  ProductDTO,
  ProviderRequest,
  ProviderSummary,
  QuoteDTO,
  RequestDetail,
  RequestSummary,
  ShrineDTO,
  VowDTO,
} from "@/lib/types";

// ---------- ตัวช่วยแปลงข้อมูล ----------

function parseList<T = string>(json: string): T[] {
  try {
    const value = JSON.parse(json);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

async function ratingsFor(providerIds: string[]) {
  if (providerIds.length === 0) return new Map<string, { rating: number; count: number }>();
  const rows = await db.review.groupBy({
    by: ["providerId"],
    where: { providerId: { in: providerIds } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return new Map(
    rows.map((r) => [r.providerId, { rating: r._avg.rating ?? 0, count: r._count._all }]),
  );
}

function toProvider(
  p: Provider,
  ratings: Map<string, { rating: number; count: number }>,
): ProviderSummary {
  const r = ratings.get(p.id);
  return {
    id: p.id,
    name: p.name,
    kind: p.kind as ProviderKind,
    status: p.status as ProviderStatus,
    description: p.description,
    publicAddress: p.publicAddress,
    contactHours: p.contactHours,
    coverUrl: p.coverUrl,
    phone: p.phone,
    areas: parseList<AreaCode>(p.areas),
    rating: r ? Math.round(r.rating * 10) / 10 : null,
    reviewCount: r?.count ?? 0,
    location: p.baseLat !== null && p.baseLng !== null ? { lat: p.baseLat, lng: p.baseLng } : null,
    serviceRadiusKm: p.serviceRadiusKm,
  };
}

function toLocation(lat: number | null, lng: number | null): { lat: number; lng: number } | null {
  return lat !== null && lng !== null ? { lat, lng } : null;
}

type OrderRow = Prisma.OrderGetPayload<{
  include: { items: true; provider: true; user: true };
}>;

function toOrderSummary(o: OrderRow): OrderSummary {
  return {
    id: o.id,
    code: o.code,
    type: o.type as OrderType,
    status: o.status as OrderStatus,
    title: o.items[0]?.name ?? "",
    total: o.total,
    deposit: o.deposit,
    area: o.area as AreaCode,
    scheduledAt: o.scheduledAt?.toISOString() ?? null,
    createdAt: o.createdAt.toISOString(),
    providerName: o.provider.name,
    customerName: o.user.name,
    customerPhone: o.user.phone,
  };
}

const orderInclude = { items: true, provider: true, user: true } as const;

type RequestRow = Prisma.ServiceRequestGetPayload<{
  include: { user: true; order: true; _count: { select: { quotes: true } } };
}>;

function toRequestSummary(r: RequestRow): RequestSummary {
  return {
    id: r.id,
    type: r.type as RequestType,
    status: r.status as RequestStatus,
    description: r.description,
    area: r.area as AreaCode,
    address: r.address,
    location: toLocation(r.lat, r.lng),
    photoUrls: parseList(r.photoUrls),
    createdAt: r.createdAt.toISOString(),
    quoteCount: r._count.quotes,
    orderId: r.order?.id ?? null,
    customerName: r.user.name,
  };
}

const requestInclude = {
  user: true,
  order: true,
  _count: { select: { quotes: true } },
} as const;

// ---------- แค็ตตาล็อก ----------

/** ศาลที่เปิดขายจากร้านที่ตรวจสอบแล้ว กรองตามพื้นที่ ประเภท และงบได้ */
export async function listProducts(filter: {
  area?: AreaCode;
  kind?: ShrineKind;
  maxPrice?: number;
  /** คำค้นจากชื่อหรือรายละเอียด */
  q?: string;
  sort?: "price_asc" | "price_desc" | "newest" | "nearest";
  /** ตำแหน่งของลูกค้า: ซ่อนร้านที่รัศมีบริการไม่ถึง และคำนวณระยะให้ */
  near?: { lat: number; lng: number };
} = {}): Promise<ProductDTO[]> {
  const rows = await db.product.findMany({
    where: {
      active: true,
      provider: { status: "VERIFIED" },
      ...(filter.kind ? { kind: filter.kind } : {}),
      ...(filter.maxPrice ? { price: { lte: filter.maxPrice } } : {}),
      ...(filter.q
        ? { OR: [{ name: { contains: filter.q } }, { description: { contains: filter.q } }] }
        : {}),
    },
    include: { provider: true },
    orderBy:
      filter.sort === "price_desc"
        ? { price: "desc" }
        : filter.sort === "newest"
          ? { createdAt: "desc" }
          : { price: "asc" },
  });
  const inArea = filter.area
    ? rows.filter((p) => parseList(p.provider.areas).includes(filter.area!))
    : rows;
  const near = filter.near;
  const withDistance = inArea.map((p) => {
    const base = toLocation(p.provider.baseLat, p.provider.baseLng);
    const km = near && base ? distanceKm(base, near) : null;
    return { p, km };
  });
  const reachable = near
    ? withDistance.filter(({ p, km }) => km === null || !p.provider.serviceRadiusKm || km <= p.provider.serviceRadiusKm)
    : withDistance;
  if (filter.sort === "nearest") {
    reachable.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity));
  }
  const ratings = await ratingsFor([...new Set(reachable.map(({ p }) => p.providerId))]);
  return reachable.map(({ p, km }) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    kind: p.kind as ShrineKind,
    price: p.price,
    imageUrl: p.imageUrl,
    active: p.active,
    provider: toProvider(p.provider, ratings),
    ...(near ? { distanceKm: km } : {}),
  }));
}

/** วันที่ร้านไม่รับงาน นับจากวันนี้เป็นต้นไป (YYYY-MM-DD เรียงจากใกล้ไปไกล) */
export async function listBlockedDates(providerId: string): Promise<string[]> {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
  const rows = await db.providerBlockedDate.findMany({
    where: { providerId, date: { gte: today } },
    orderBy: { date: "asc" },
    select: { date: true },
  });
  return rows.map((r) => r.date);
}

/** ศาลหนึ่งรายการ พร้อมบริการเสริมของร้านเดียวกัน */
export async function getProduct(id: string): Promise<ProductDetail | null> {
  const p = await db.product.findFirst({
    where: { id, active: true, provider: { status: "VERIFIED" } },
    include: {
      provider: { include: { packages: { where: { active: true }, orderBy: { price: "asc" } } } },
    },
  });
  if (!p) return null;
  const ratings = await ratingsFor([p.providerId]);
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    kind: p.kind as ShrineKind,
    price: p.price,
    imageUrl: p.imageUrl,
    active: p.active,
    provider: toProvider(p.provider, ratings),
    packages: p.provider.packages.map(toPackage),
  };
}

function toPackage(s: {
  id: string;
  type: string;
  name: string;
  description: string;
  price: number;
  active: boolean;
}): PackageDTO {
  return {
    id: s.id,
    type: s.type as PackageType,
    name: s.name,
    description: s.description,
    price: s.price,
    active: s.active,
  };
}

// ---------- ลูกค้า ----------

export async function listMyShrines(userId: string): Promise<ShrineDTO[]> {
  const rows = await db.shrine.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    kind: s.kind as ShrineKind,
    area: s.area as AreaCode,
    address: s.address,
    photoUrl: s.photoUrl,
    installedAt: s.installedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
  }));
}

export async function listMyOrders(userId: string): Promise<OrderSummary[]> {
  const rows = await db.order.findMany({
    where: { userId },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toOrderSummary);
}

/**
 * รายละเอียดคำสั่ง ดูได้เฉพาะลูกค้าเจ้าของ ผู้ให้บริการของคำสั่ง หรือผู้ดูแลระบบ
 * คืน null ถ้าไม่พบหรือไม่มีสิทธิ์
 */
export async function getOrder(orderId: string, viewer: CurrentUser): Promise<OrderDetail | null> {
  const o = await db.order.findUnique({
    where: { id: orderId },
    include: {
      ...orderInclude,
      events: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "asc" } },
      review: true,
      messages: { orderBy: { createdAt: "asc" }, include: { sender: true } },
    },
  });
  if (!o) return null;

  let viewerIs: OrderDetail["viewerIs"] | null = null;
  if (o.userId === viewer.id) viewerIs = "CUSTOMER";
  else if (o.provider.userId === viewer.id) viewerIs = "PROVIDER";
  else if (viewer.role === "ADMIN") viewerIs = "ADMIN";
  if (!viewerIs) return null;

  const ratings = await ratingsFor([o.providerId]);
  // เงินที่คืนแล้วไม่นับเป็นยอดที่จ่าย
  const paid = o.payments.filter((p) => p.status === "PAID").reduce((sum, p) => sum + p.amount, 0);

  return {
    ...toOrderSummary(o),
    address: o.address,
    location: toLocation(o.lat, o.lng),
    note: o.note,
    placeType: o.placeType as PlaceType | "",
    shrineKind: o.shrineKind as ShrineKind | "",
    preferredDates: parseList(o.preferredDates),
    items: o.items.map((i) => ({ id: i.id, name: i.name, price: i.price })),
    events: o.events.map((e) => ({
      id: e.id,
      title: e.title,
      note: e.note,
      photoUrl: e.photoUrl,
      byRole: e.byRole as Role | "SYSTEM",
      createdAt: e.createdAt.toISOString(),
    })),
    payments: o.payments.map((p) => ({
      id: p.id,
      kind: p.kind as "DEPOSIT" | "BALANCE",
      amount: p.amount,
      method: p.method as PaymentMethod,
      status: p.status as PaymentDTO["status"],
      paidAt: p.paidAt?.toISOString() ?? null,
    })),
    review: o.review
      ? {
          rating: o.review.rating,
          comment: o.review.comment,
          photoUrls: parseList(o.review.photoUrls),
          createdAt: o.review.createdAt.toISOString(),
        }
      : null,
    provider: toProvider(o.provider, ratings),
    balance: Math.max(o.total - paid, 0),
    viewerIs,
    messages: o.messages.map((m) => ({
      id: m.id,
      body: m.body,
      photoUrl: m.photoUrl,
      createdAt: m.createdAt.toISOString(),
      mine: m.senderId === viewer.id,
      senderName: m.senderId === o.userId ? o.user.name : m.senderId === o.provider.userId ? o.provider.name : "ทีมงาน Saan",
      senderIs: m.senderId === o.userId ? "CUSTOMER" : m.senderId === o.provider.userId ? "PROVIDER" : "ADMIN",
    })),
  };
}

export async function listMyRequests(userId: string): Promise<RequestSummary[]> {
  const rows = await db.serviceRequest.findMany({
    where: { userId },
    include: requestInclude,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toRequestSummary);
}

/** คำขอของลูกค้าพร้อมใบเสนอราคาทั้งหมด คืน null ถ้าไม่ใช่เจ้าของ */
export async function getMyRequest(requestId: string, userId: string): Promise<RequestDetail | null> {
  const r = await db.serviceRequest.findFirst({
    where: { id: requestId, userId },
    include: {
      ...requestInclude,
      quotes: { include: { provider: true }, orderBy: { price: "asc" } },
    },
  });
  if (!r) return null;
  const ratings = await ratingsFor(r.quotes.map((q) => q.providerId));
  const quotes: QuoteDTO[] = r.quotes.map((q) => ({
    id: q.id,
    price: q.price,
    note: q.note,
    status: q.status as QuoteDTO["status"],
    createdAt: q.createdAt.toISOString(),
    provider: toProvider(q.provider, ratings),
  }));
  return { ...toRequestSummary(r), quotes };
}

function toVow(v: {
  id: string;
  place: string;
  lat: number | null;
  lng: number | null;
  wish: string;
  promise: string;
  status: string;
  remindAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): VowDTO {
  return {
    id: v.id,
    place: v.place,
    location: v.lat !== null && v.lng !== null ? { lat: v.lat, lng: v.lng } : null,
    wish: v.wish,
    promise: v.promise,
    status: v.status as VowStatus,
    remindAt: v.remindAt?.toISOString() ?? null,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  };
}

export async function listMyVows(userId: string): Promise<VowDTO[]> {
  const rows = await db.vow.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return rows.map(toVow);
}

export async function getMyVow(vowId: string, userId: string): Promise<VowDTO | null> {
  const v = await db.vow.findFirst({ where: { id: vowId, userId } });
  return v ? toVow(v) : null;
}

// ---------- ผู้ให้บริการ ----------

/** โปรไฟล์ผู้ให้บริการของผู้ใช้ หรือ null ถ้ายังไม่ได้สมัคร */
export async function getMyProvider(userId: string): Promise<ProviderSummary | null> {
  const p = await db.provider.findUnique({ where: { userId } });
  if (!p) return null;
  return toProvider(p, await ratingsFor([p.id]));
}

/** ศาลทั้งหมดของร้าน รวมที่ปิดขายอยู่ */
export async function listProviderProducts(providerId: string): Promise<ProductDTO[]> {
  const rows = await db.product.findMany({
    where: { providerId },
    include: { provider: true },
    orderBy: { createdAt: "desc" },
  });
  const ratings = await ratingsFor([providerId]);
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    kind: p.kind as ShrineKind,
    price: p.price,
    imageUrl: p.imageUrl,
    active: p.active,
    provider: toProvider(p.provider, ratings),
  }));
}

/** บริการเสริมทั้งหมดของร้าน รวมที่ปิดขายอยู่ */
export async function listProviderPackages(providerId: string): Promise<PackageDTO[]> {
  const rows = await db.servicePackage.findMany({
    where: { providerId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toPackage);
}

/** คำสั่งของร้าน ไม่รวมคำสั่งที่ลูกค้ายังไม่จ่ายมัดจำ */
export async function listProviderOrders(providerId: string): Promise<OrderSummary[]> {
  const rows = await db.order.findMany({
    where: { providerId, status: { not: "AWAITING_DEPOSIT" } },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toOrderSummary);
}

/** คำขอที่ยังเปิดอยู่ในพื้นที่ที่ร้านให้บริการ */
export async function listOpenRequestsForProvider(provider: ProviderSummary): Promise<ProviderRequest[]> {
  const rows = await db.serviceRequest.findMany({
    where: { status: "OPEN", area: { in: provider.areas } },
    include: { ...requestInclude, quotes: { where: { providerId: provider.id } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => {
    const mine = r.quotes[0];
    return {
      ...toRequestSummary(r),
      myQuote: mine
        ? { price: mine.price, note: mine.note, status: mine.status as QuoteDTO["status"] }
        : null,
    };
  });
}

// ---------- ผู้ดูแลระบบ ----------

export async function listAllProviders(): Promise<ProviderSummary[]> {
  const rows = await db.provider.findMany({ orderBy: { createdAt: "desc" } });
  const ratings = await ratingsFor(rows.map((p) => p.id));
  return rows.map((p) => toProvider(p, ratings));
}

export async function listAllOrders(): Promise<OrderSummary[]> {
  const rows = await db.order.findMany({
    include: orderInclude,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return rows.map(toOrderSummary);
}

export async function getAdminStats(): Promise<AdminStats> {
  const [pendingProviders, verifiedProviders, activeOrders, completedOrders, openRequests] =
    await Promise.all([
      db.provider.count({ where: { status: "PENDING" } }),
      db.provider.count({ where: { status: "VERIFIED" } }),
      db.order.count({ where: { status: { in: ["AWAITING_PROVIDER", "CONFIRMED", "DONE"] } } }),
      db.order.count({ where: { status: "COMPLETED" } }),
      db.serviceRequest.count({ where: { status: "OPEN" } }),
    ]);
  return { pendingProviders, verifiedProviders, activeOrders, completedOrders, openRequests };
}

// ---------- การตั้งค่าและที่อยู่ ----------

export async function getSettings(userId: string): Promise<SettingsDTO> {
  const u = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { largeText: true, notifyOrders: true, notifyQuotes: true, notifyVows: true },
  });
  return u;
}

/** ที่อยู่ที่บันทึกไว้ ที่อยู่หลักอยู่บนสุด */
export async function listAddresses(userId: string): Promise<AddressDTO[]> {
  const rows = await db.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return rows.map((a) => ({
    id: a.id,
    label: a.label,
    area: a.area as AreaCode,
    address: a.address,
    location: toLocation(a.lat, a.lng),
    isDefault: a.isDefault,
  }));
}

// ---------- การแจ้งเตือน ----------

/** สร้างการแจ้งเตือนสำหรับรายการในสมุดบนที่ถึงวันเตือนแล้ว (ทำครั้งเดียวต่อรายการ) */
async function syncVowReminders(userId: string) {
  const due = await db.vow.findMany({
    where: { userId, remindedAt: null, remindAt: { lte: new Date() }, status: { not: "FULFILLED" } },
  });
  if (due.length === 0) return;
  const user = await db.user.findUnique({ where: { id: userId }, select: { notifyVows: true } });
  for (const vow of due) {
    if (user?.notifyVows) {
      await db.notification.create({
        data: {
          userId,
          kind: "VOW",
          title: vow.status === "GRANTED" ? "อย่าลืมแก้บน" : "ถึงวันที่ตั้งเตือนในสมุดบน",
          body: `${vow.place}: ${vow.promise}`,
          href: `/vows/${vow.id}`,
        },
      });
    }
    await db.vow.update({ where: { id: vow.id }, data: { remindedAt: new Date() } });
  }
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  await syncVowReminders(userId);
  return db.notification.count({ where: { userId, readAt: null } });
}

/** Latest 50 owner-scoped notifications, optionally restricted to unread records. */
export async function listNotifications(userId: string, unreadOnly = false): Promise<NotificationDTO[]> {
  await syncVowReminders(userId);
  const rows = await db.notification.findMany({
    where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rows.map((n) => ({
    id: n.id,
    kind: n.kind as NotificationDTO["kind"],
    title: n.title,
    body: n.body,
    href: n.href,
    read: n.readAt !== null,
    createdAt: n.createdAt.toISOString(),
  }));
}

// ---------- ศาลของฉัน: รายละเอียดและประวัติการดูแล ----------

export async function getMyShrine(shrineId: string, userId: string): Promise<ShrineDetail | null> {
  const s = await db.shrine.findFirst({
    where: { id: shrineId, userId },
    include: {
      careLogs: { orderBy: { doneAt: "desc" } },
      orders: { include: orderInclude, orderBy: { createdAt: "desc" } },
      requests: { include: requestInclude, orderBy: { createdAt: "desc" } },
    },
  });
  if (!s) return null;
  const careLogs: CareLogDTO[] = s.careLogs.map((c) => ({
    id: c.id,
    title: c.title,
    note: c.note,
    photoUrl: c.photoUrl,
    doneAt: c.doneAt.toISOString(),
  }));
  return {
    id: s.id,
    name: s.name,
    kind: s.kind as ShrineKind,
    area: s.area as AreaCode,
    address: s.address,
    photoUrl: s.photoUrl,
    installedAt: s.installedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    careLogs,
    orders: s.orders.map(toOrderSummary),
    requests: s.requests.map(toRequestSummary),
  };
}

// ---------- หน้าร้านสาธารณะ ----------

function maskName(name: string): string {
  const clean = name.replace(/^คุณ\s*/, "").trim();
  return clean ? `คุณ${Array.from(clean)[0]}.` : "ลูกค้า";
}

/** ข้อมูลร้านที่ลูกค้าทั่วไปเห็น เฉพาะร้านที่ตรวจสอบแล้ว */
export async function getPublicProvider(providerId: string): Promise<PublicProvider | null> {
  const p = await db.provider.findFirst({
    where: { id: providerId, status: "VERIFIED" },
    include: {
      products: { where: { active: true }, orderBy: { price: "asc" } },
      packages: { where: { active: true }, orderBy: { price: "asc" } },
      reviews: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 30 },
    },
  });
  if (!p) return null;
  const ratings = await ratingsFor([p.id]);
  const provider = toProvider(p, ratings);
  const completedOrders = await db.order.count({ where: { providerId: p.id, status: "COMPLETED" } });
  return {
    provider,
    products: p.products.map((x) => ({
      id: x.id,
      name: x.name,
      description: x.description,
      kind: x.kind as ShrineKind,
      price: x.price,
      imageUrl: x.imageUrl,
      active: x.active,
      provider,
    })),
    packages: p.packages.map(toPackage),
    reviews: p.reviews.map((r) => ({
      rating: r.rating,
      comment: r.comment,
      photoUrls: parseList(r.photoUrls),
      createdAt: r.createdAt.toISOString(),
      customerName: maskName(r.user.name),
    })),
    completedOrders,
  };
}

// ---------- ผู้ดูแลระบบ: คืนมัดจำ ----------

/** คำสั่งที่ยกเลิกแล้วแต่ยังไม่ได้คืนมัดจำ */
export async function listPendingRefunds(): Promise<RefundItem[]> {
  const rows = await db.order.findMany({
    where: { status: "CANCELLED", payments: { some: { status: "PAID" } } },
    include: { ...orderInclude, payments: true },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((o) => ({
    ...toOrderSummary(o),
    refundAmount: o.payments.filter((p) => p.status === "PAID").reduce((sum, p) => sum + p.amount, 0),
  }));
}
