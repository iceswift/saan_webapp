/** Canonical same-site destinations only; reject browser slash normalization and login loops. */
export function safeLoginNext(value: string | string[] | undefined): string {
  if (typeof value !== "string" || value.length > 2048 || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(value) || /^\/(?:%2f|%5c)/i.test(value)) return "/";
  try {
    const url = new URL(value, "https://saan.invalid");
    if (url.origin !== "https://saan.invalid" || url.pathname.startsWith("//") || /^\/login\/?$/.test(url.pathname)) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return "/"; }
}
