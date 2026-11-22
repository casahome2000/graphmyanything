export const EMAIL_BRAND = {
  background: "#0a0a0f",
  surface: "#12121c",
  surfaceElevated: "#0c0c12",
  border: "rgba(255,255,255,0.1)",
  text: "#f4f4f7",
  muted: "#8b8b9e",
  violet: "#8b5cf6",
  cyan: "#22d3ee",
  emerald: "#34d399",
  ink: "#06060a",
} as const;

export const DEFAULT_SITE_URL = "https://graphmyanything.com";

export const WAITLIST_CHART_IMAGE_PATH = "/email/waitlist-sparkline.png";
export const EMAIL_ICON_TRACK = "/email/icon-track.png";
export const EMAIL_ICON_QUERY = "/email/icon-query.png";
export const EMAIL_ICON_CHART = "/email/icon-chart.png";

export type EmailAssetUrls = {
  chart: string;
  iconTrack: string;
  iconQuery: string;
  iconChart: string;
};

export function productionEmailAssetUrls(): EmailAssetUrls {
  const base = siteUrl();
  return {
    chart: `${base}${WAITLIST_CHART_IMAGE_PATH}`,
    iconTrack: `${base}${EMAIL_ICON_TRACK}`,
    iconQuery: `${base}${EMAIL_ICON_QUERY}`,
    iconChart: `${base}${EMAIL_ICON_CHART}`,
  };
}

export function siteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (fromEnv) {
    return fromEnv.startsWith("http") ? fromEnv.replace(/\/$/, "") : `https://${fromEnv}`;
  }
  return DEFAULT_SITE_URL;
}

export function waitlistChartImageUrl(): string {
  return productionEmailAssetUrls().chart;
}