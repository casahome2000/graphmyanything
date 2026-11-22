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
  return `${siteUrl()}${WAITLIST_CHART_IMAGE_PATH}`;
}