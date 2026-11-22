export const ATTRIBUTION_STORAGE_KEY = "gma_attribution_v1";

export type AttributionSnapshot = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  referrer: string | null;
  landing_path: string | null;
};

export type AttributionPayload = AttributionSnapshot & {
  source?: string;
};

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
] as const;

export function emptyAttribution(): AttributionSnapshot {
  return {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    referrer: null,
    landing_path: null,
  };
}

/** Capture first-touch attribution for this browser tab (sessionStorage). */
export function captureFirstTouchAttribution(): AttributionSnapshot | null {
  if (typeof window === "undefined") return null;

  const existing = readAttributionFromSession();
  if (existing) return existing;

  const params = new URLSearchParams(window.location.search);
  const snap: AttributionSnapshot = {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_content: params.get("utm_content"),
    referrer: document.referrer?.trim() ? document.referrer : null,
    landing_path:
      `${window.location.pathname}${window.location.search}${window.location.hash}`.slice(
        0,
        512,
      ) || null,
  };

  try {
    sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(snap));
  } catch {
    /* quota / private mode */
  }
  return snap;
}

export function readAttributionFromSession(): AttributionSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AttributionSnapshot>;
    return {
      utm_source: parsed.utm_source ?? null,
      utm_medium: parsed.utm_medium ?? null,
      utm_campaign: parsed.utm_campaign ?? null,
      utm_content: parsed.utm_content ?? null,
      referrer: parsed.referrer ?? null,
      landing_path: parsed.landing_path ?? null,
    };
  } catch {
    return null;
  }
}

export function attributionForAnalytics(
  snap: AttributionSnapshot | null,
): Record<string, string> {
  if (!snap) return {};
  const out: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    if (snap[key]) out[key] = snap[key]!;
  }
  if (snap.referrer) out.referrer = snap.referrer.slice(0, 200);
  if (snap.landing_path) out.landing_path = snap.landing_path.slice(0, 200);
  return out;
}

export function attributionForApi(
  snap: AttributionSnapshot | null,
  source?: string,
): AttributionPayload {
  const base = snap ?? emptyAttribution();
  return source ? { ...base, source } : base;
}

/** Compact Stripe Payment Link `client_reference_id` for preorder attribution. */
export function preorderClientReferenceId(
  snap: AttributionSnapshot | null,
): string | undefined {
  if (!snap) return undefined;
  const parts = [
    snap.utm_source,
    snap.utm_medium,
    snap.utm_campaign,
    snap.landing_path,
  ]
    .filter(Boolean)
  return parts.length ? parts.join("|").slice(0, 200) : undefined;
}

export function appendAttributionToPreorderUrl(
  baseUrl: string,
  snap: AttributionSnapshot | null,
): string {
  try {
    const url = new URL(baseUrl);
    for (const key of UTM_KEYS) {
      const value = snap?.[key];
      if (value && !url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    }
    const ref = preorderClientReferenceId(snap);
    if (ref && !url.searchParams.has("client_reference_id")) {
      url.searchParams.set("client_reference_id", ref);
    }
    return url.toString();
  } catch {
    return baseUrl;
  }
}