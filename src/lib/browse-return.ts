/** Accept only a local browse destination; never use an arbitrary return URL. */
export function browseReturn(value: string | undefined): string | undefined {
  if (!value || !/^\/browse(?:\?|$)/.test(value) || value.length > 1000) return undefined;
  const url = new URL(value, "https://saan.invalid");
  const query = new URLSearchParams();
  for (const key of ["q", "kind", "area", "max", "sort", "near"]) {
    const item = url.searchParams.get(key);
    if (item) query.set(key, item);
  }
  return query.size ? `/browse?${query}` : "/browse";
}
