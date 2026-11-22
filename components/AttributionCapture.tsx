"use client";

import { useEffect } from "react";
import { captureFirstTouchAttribution } from "@/lib/attribution";

/** Runs once per tab to freeze first-touch UTMs, referrer, and landing path. */
export function AttributionCapture() {
  useEffect(() => {
    captureFirstTouchAttribution();
  }, []);
  return null;
}