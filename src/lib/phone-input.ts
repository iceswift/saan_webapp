/** Accept common Thai input without silently stripping arbitrary letters. */
export function normalizeThaiDigits(value: string): string {
  return value.replace(/[๐-๙]/g, digit => String(digit.charCodeAt(0) - 0x0e50));
}

export function normalizeThaiPhone(value: string): string {
  const compact = normalizeThaiDigits(value).trim().replace(/[\s()\-]/g, "");
  return /^\+?66\d{9}$/.test(compact) ? `0${compact.replace(/^\+?66/, "")}` : compact;
}
