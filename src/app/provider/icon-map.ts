// ไอคอนและสีประจำแต่ละประเภท ใช้ร่วมกันระหว่างหน้าผู้ให้บริการและหน้าผู้ดูแลระบบ
import {
  Building2,
  Flower2,
  Hammer,
  Home,
  Landmark,
  Layers,
  Package,
  Shovel,
  Sparkles,
  Store,
  Truck,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { ServiceArtName, Tint } from "@/components/visuals";
import type {
  OrderType,
  PackageType,
  ProviderKind,
  RequestType,
  ShrineKind,
} from "@/lib/constants";

export type Visual = { icon: LucideIcon; tint: Tint };

export const PROVIDER_KIND_VISUAL: Record<ProviderKind, Visual> = {
  SHOP: { icon: Store, tint: "amber" },
  BRAHMIN: { icon: Flower2, tint: "violet" },
  TECHNICIAN: { icon: Wrench, tint: "sky" },
  CARETAKER: { icon: UserRound, tint: "mint" },
};

export const ORDER_TYPE_VISUAL: Record<OrderType, Visual> = {
  INSTALL: { icon: Landmark, tint: "mint" },
  REMOVE: { icon: Truck, tint: "amber" },
  REPAIR: { icon: Hammer, tint: "sky" },
};

export const REQUEST_TYPE_VISUAL: Record<RequestType, Visual> = {
  REMOVE: { icon: Truck, tint: "amber" },
  REPAIR: { icon: Hammer, tint: "sky" },
};

export const SHRINE_KIND_VISUAL: Record<ShrineKind, Visual> = {
  PHRA_PHUM: { icon: Landmark, tint: "mint" },
  CHAO_THI: { icon: Home, tint: "amber" },
  PAIR: { icon: Layers, tint: "sky" },
  PHRA_PHROM: { icon: Sparkles, tint: "violet" },
  MODERN: { icon: Building2, tint: "rose" },
};

export const PACKAGE_TYPE_VISUAL: Record<PackageType, Visual> = {
  CEREMONY: { icon: Flower2, tint: "violet" },
  OFFERINGS: { icon: Package, tint: "amber" },
  BASE: { icon: Shovel, tint: "mint" },
  REMOVE_OLD: { icon: Truck, tint: "sky" },
};

// ภาพบริการสำหรับ ThumbArt (v6): งาน คำขอ และบริการเสริมใช้ภาพวาดแทนไอคอนในวงกลม
export const ORDER_TYPE_ART: Record<OrderType, ServiceArtName> = {
  INSTALL: "install",
  REMOVE: "move",
  REPAIR: "repair",
};

export const REQUEST_TYPE_ART: Record<RequestType, ServiceArtName> = {
  REMOVE: "move",
  REPAIR: "repair",
};

export const PACKAGE_TYPE_ART: Record<PackageType, ServiceArtName> = {
  CEREMONY: "ceremony",
  OFFERINGS: "offering",
  BASE: "install",
  REMOVE_OLD: "move",
};
