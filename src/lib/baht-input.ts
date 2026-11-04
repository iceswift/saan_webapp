import { normalizeThaiDigits } from "./phone-input";

/** Whole baht only. Do not silently reinterpret malformed thousands separators or decimals. */
export function parseWholeBaht(value: string, max = 10_000_000): number | null {
  const normalized = normalizeThaiDigits(value).trim();
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(normalized)) return null;
  const amount = Number(normalized.replaceAll(",", ""));
  return Number.isSafeInteger(amount) && amount >= 0 && amount <= max ? amount : null;
}
