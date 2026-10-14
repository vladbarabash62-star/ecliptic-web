export const EXCLUDED_ANALYTICS_VISITOR_IDS = [
  "8cf99251-32be-4daa-bd0a-4e9543668326",
];

export function isExcludedAnalyticsVisitor(visitorId?: string) {
  return EXCLUDED_ANALYTICS_VISITOR_IDS.includes(String(visitorId || "").toLowerCase());
}
