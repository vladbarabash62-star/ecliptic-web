export type SiteSettings = {
  reviewsCountLabel: string;
};

export const defaultSiteSettings: SiteSettings = {
  reviewsCountLabel: "400+",
};

function trimLimit(value: unknown, fallback: string, limit: number) {
  if (typeof value !== "string") return fallback;
  return (
    value
      .replace(/[<>]/g, "")
      .replace(/[\u0000-\u001F\u007F]/g, " ")
      .trim()
      .slice(0, limit) || fallback
  );
}

export function normalizeSiteSettings(value: unknown): SiteSettings {
  const source = value && typeof value === "object" && !Array.isArray(value) ? (value as Partial<SiteSettings>) : {};

  return {
    reviewsCountLabel: trimLimit(source.reviewsCountLabel, defaultSiteSettings.reviewsCountLabel, 24),
  };
}
