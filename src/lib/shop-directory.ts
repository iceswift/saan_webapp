import type { AreaCode, ProviderKind } from "./constants";
export type DirectoryShop = {
  id: string;
  name: string;
  kind: ProviderKind;
  address: string;
  areas: AreaCode[];
  location: { lat: number; lng: number } | null;
};
