import type { ChartTheme } from "./svg-chart.js";

/** Distinct, colorblind-friendly defaults (Okabe–Ito inspired). */
export const DEFAULT_SERIES_COLORS: readonly string[] = [
  "#8b5cf6",
  "#22d3ee",
  "#f472b6",
  "#84cc16",
  "#fb923c",
];

export function seriesColorAt(index: number, override?: string, theme: ChartTheme = "dark"): string {
  if (override?.trim()) return override.trim();
  const palette = DEFAULT_SERIES_COLORS;
  return palette[index % palette.length] ?? (theme === "dark" ? "#8b5cf6" : "#7c3aed");
}