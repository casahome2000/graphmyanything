import type { DataPoint } from "./lttb.js";
import { computeSummary } from "./summary.js";

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function mad(values: number[], med: number): number {
  const deviations = values.map((v) => Math.abs(v - med));
  return median(deviations) || 1e-9;
}

export type InsightResult = {
  summary: string;
  trend: string;
  anomalies: { ts: number; value: number; z: number }[];
  forecast: { horizon: number; next_values: number[]; method: string };
  stats: ReturnType<typeof computeSummary>;
};

function linearForecast(points: DataPoint[], horizon: number): number[] {
  if (points.length < 2) {
    const v = points[0]?.value ?? 0;
    return Array(horizon).fill(v);
  }
  const n = points.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    const x = i;
    const y = points[i].value;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }
  const denom = n * sumXX - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const out: number[] = [];
  for (let h = 1; h <= horizon; h++) {
    out.push(Math.round((intercept + slope * (n - 1 + h)) * 100) / 100);
  }
  return out;
}

export function generateInsight(
  metric: string,
  points: DataPoint[],
  rangeLabel: string,
): InsightResult {
  const stats = computeSummary(points);
  const values = points.map((p) => p.value);
  const med = median(values);
  const madVal = mad(values, med);

  const anomalies: InsightResult["anomalies"] = [];
  for (const p of points) {
    const z = (0.6745 * (p.value - med)) / madVal;
    if (Math.abs(z) > 3.5) {
      anomalies.push({
        ts: p.ts,
        value: p.value,
        z: Math.round(z * 100) / 100,
      });
    }
  }
  anomalies.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
  const topAnomalies = anomalies.slice(0, 5);

  const forecast = linearForecast(points, 3);
  const horizon = 3;

  let trendText = "Not enough data to infer a trend.";
  if (stats.trend === "up") {
    trendText = `Upward trend over ${rangeLabel}: latest ${stats.latest}, ${stats.pct_change}% vs start.`;
  } else if (stats.trend === "down") {
    trendText = `Downward trend over ${rangeLabel}: latest ${stats.latest}, ${stats.pct_change}% vs start.`;
  } else if (stats.trend === "flat") {
    trendText = `Mostly flat over ${rangeLabel} (≈${stats.pct_change}% change).`;
  }

  const anomalyText =
    topAnomalies.length === 0
      ? "No strong anomalies detected (MAD z-score threshold 3.5)."
      : `${topAnomalies.length} anomal${topAnomalies.length === 1 ? "y" : "ies"} flagged by robust z-score.`;

  const forecastText = `Naive linear forecast (next ${horizon} steps): ${forecast.join(", ")}.`;

  const summary = [
    `Metric "${metric}" (${stats.count} points, ${rangeLabel}).`,
    trendText,
    anomalyText,
    forecastText,
  ].join(" ");

  return {
    summary,
    trend: trendText,
    anomalies: topAnomalies,
    forecast: {
      horizon,
      next_values: forecast,
      method: "naive_linear_regression_on_index",
    },
    stats,
  };
}