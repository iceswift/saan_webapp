import {
  Anchor,
  Banknote,
  Building,
  CircleHelp,
  Coins,
  Factory,
  Flower,
  HandCoins,
  House,
  Infinity as UnlimitedIcon,
  Landmark,
  MapPin,
  Sparkles,
  Store,
  Trees,
  TreePine,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Tint } from "@/components/visuals";
import type { AreaCode, PlaceType, ShrineKind } from "@/lib/constants";

// ค่าที่ใช้ร่วมกันระหว่างตัวช่วยถามคำตอบ (/new) และหน้าศาลที่ตรงกับคำตอบ (/new/products)

export type Visual = { icon: LucideIcon; tint: Tint };

export const PLACE_VISUALS: Record<PlaceType, Visual> = {
  HOME: { icon: House, tint: "mint" },
  SHOP: { icon: Store, tint: "amber" },
  FACTORY: { icon: Factory, tint: "rose" },
  ESTATE: { icon: Building, tint: "sky" },
};

export const KIND_VISUALS: Record<ShrineKind, Visual> = {
  PHRA_PHUM: { icon: Landmark, tint: "mint" },
  CHAO_THI: { icon: TreePine, tint: "amber" },
  PAIR: { icon: Users, tint: "sky" },
  PHRA_PHROM: { icon: Flower, tint: "rose" },
  MODERN: { icon: Sparkles, tint: "violet" },
};

export const UNSURE_KIND_VISUAL: Visual = { icon: CircleHelp, tint: "violet" };

export const AREA_VISUALS: Record<AreaCode, Visual> = {
  BKK: { icon: Building, tint: "mint" },
  NBI: { icon: MapPin, tint: "amber" },
  PTE: { icon: Trees, tint: "sky" },
  SPK: { icon: Anchor, tint: "rose" },
};

export type BudgetOption = {
  /** null หมายถึงไม่จำกัดงบ */
  value: number | null;
  label: string;
  icon: LucideIcon;
  tint: Tint;
};

export const BUDGET_OPTIONS: readonly BudgetOption[] = [
  { value: 10000, label: "ไม่เกิน 10,000 บาท", icon: Coins, tint: "mint" },
  { value: 20000, label: "ไม่เกิน 20,000 บาท", icon: HandCoins, tint: "amber" },
  { value: 40000, label: "ไม่เกิน 40,000 บาท", icon: Banknote, tint: "sky" },
  { value: null, label: "ไม่จำกัดงบ", icon: UnlimitedIcon, tint: "violet" },
];

const BUDGET_VALUES: number[] = BUDGET_OPTIONS.flatMap((o) => (o.value === null ? [] : [o.value]));

/** ค่าที่อ่านจาก searchParams อาจเป็นสตริงหรืออาร์เรย์ ใช้ค่าแรก */
export function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** คืนค่าเมื่ออยู่ในรายการรหัสที่กำหนด มิฉะนั้นคืน undefined */
export function pickCode<T extends string>(
  value: string | undefined,
  codes: readonly T[],
): T | undefined {
  return value !== undefined && (codes as readonly string[]).includes(value) ? (value as T) : undefined;
}

/** งบต้องเป็นหนึ่งในค่าที่หน้าคำถามเสนอ */
export function parseBudget(value: string | undefined): number | undefined {
  const n = Number(value);
  return BUDGET_VALUES.includes(n) ? n : undefined;
}
