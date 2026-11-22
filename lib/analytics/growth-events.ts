"use client";

import { track } from "@vercel/analytics";
import {
  attributionForAnalytics,
  readAttributionFromSession,
} from "@/lib/attribution";

const PREORDER_NAV_FLUSH_MS = 350;

type EventProps = Record<string, string | number | boolean | null | undefined>;

function mergeAttribution(props?: EventProps): EventProps {
  const snap = readAttributionFromSession();
  return {
    ...attributionForAnalytics(snap),
    ...props,
  };
}

export function trackGrowthEvent(name: string, props?: EventProps): void {
  track(name, mergeAttribution(props));
}

export function trackWaitlistError(
  reason: string,
  props?: EventProps,
): void {
  trackGrowthEvent("waitlist_error", { reason, ...props });
}

/**
 * Fire preorder_click, then navigate after a short flush window so the beacon
 * can leave the page (window.open / location change).
 */
export function trackPreorderClick(
  props: EventProps,
  navigate: () => void,
): void {
  trackGrowthEvent("preorder_click", props);
  window.setTimeout(navigate, PREORDER_NAV_FLUSH_MS);
}