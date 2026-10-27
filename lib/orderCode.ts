export function compactProductCode(productSlug: string) {
  const normalized = productSlug.toLowerCase().replace(/[^a-z0-9]/g, "");
  let hash = 2166136261;
  for (const character of normalized) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  const suffix = (hash >>> 0).toString(36).toUpperCase().slice(-3).padStart(3, "0");
  return `${normalized.slice(0, 2).toUpperCase().padEnd(2, "X")}${suffix}`;
}

export function createOrderCode(productSlug: string, priceRub?: number) {
  const suffix = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase()
    : Date.now().toString(36).slice(-4).toUpperCase();
  const price = Number.isFinite(priceRub) ? String(Math.round(priceRub as number)) : "NA";
  return `E-${compactProductCode(productSlug)}-${price}-${suffix}`;
}
