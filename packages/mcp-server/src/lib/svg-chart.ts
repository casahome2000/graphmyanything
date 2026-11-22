import fs from "node:fs";
import path from "node:path";
import { resolveChartsDir } from "../paths.js";
import type { DataPoint } from "./lttb.js";

export type ChartType = "line" | "bar" | "area";
export type ChartTheme = "dark" | "light";

const THEMES: Record<
  ChartTheme,
  { bg: string; grid: string; text: string; stroke: string; fill: string }
> = {
  dark: {
    bg: "#0d0d12",
    grid: "rgba(255,255,255,0.08)",
    text: "#a8a8b8",
    stroke: "#8b5cf6",
    fill: "rgba(139,92,246,0.25)",
  },
  light: {
    bg: "#fafafa",
    grid: "rgba(0,0,0,0.08)",
    text: "#444",
    stroke: "#7c3aed",
    fill: "rgba(124,58,237,0.2)",
  },
};

const MS_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Seconds in common spans — used for tick format selection. */
const SEC_DAY = 86_400;
const SEC_YEAR = 365 * SEC_DAY;

function formatMetricLabel(metric: string): string {
  return metric.replace(/\./g, " · ");
}

function formatNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(n % 1 === 0 ? 0 : 2);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Classify time span for x-axis label formatting. */
export function xAxisTimeGranularity(
  spanSec: number,
): "intraday" | "daily" | "monthly" | "yearly" {
  if (spanSec <= 2 * SEC_DAY) return "intraday";
  if (spanSec <= 45 * SEC_DAY) return "daily";
  if (spanSec <= 3 * SEC_YEAR) return "monthly";
  return "yearly";
}

/** Format a unix-seconds timestamp for an x-axis tick. */
export function formatXAxisTick(ts: number, spanSec: number): string {
  const g = xAxisTimeGranularity(spanSec);
  const d = new Date(ts * 1000);
  if (g === "yearly") return String(d.getUTCFullYear());
  if (g === "monthly") {
    const yr = d.getUTCFullYear();
    const mon = MS_MONTHS[d.getUTCMonth()];
    return spanSec > SEC_YEAR ? `${mon} '${String(yr).slice(-2)}` : `${mon} ${d.getUTCDate()}`;
  }
  if (g === "daily") {
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  }
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Human-readable date + value for marker tooltips. */
export function formatMarkerTooltip(ts: number, value: number): string {
  const d = new Date(ts * 1000);
  const iso = d.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
  return `${iso} — ${formatNumber(value)}`;
}

/**
 * Build 5–8 x-axis tick timestamps (unix sec), always including first and last.
 */
export function pickXAxisTicks(xMin: number, xMax: number, innerWidthPx: number): number[] {
  const span = xMax - xMin;
  if (span <= 0) return [xMin];

  const minLabelPx = 52;
  const maxTicks = Math.min(8, Math.max(5, Math.floor(innerWidthPx / minLabelPx)));
  const count = Math.max(2, maxTicks);

  const ticks: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = xMin + (span * i) / (count - 1);
    ticks.push(Math.round(t));
  }
  ticks[0] = xMin;
  ticks[ticks.length - 1] = xMax;

  const unique: number[] = [];
  for (const t of ticks) {
    if (unique.length === 0 || t - unique[unique.length - 1] >= Math.max(1, span / (count * 3))) {
      unique.push(t);
    }
  }
  if (unique[unique.length - 1] !== xMax) unique.push(xMax);
  if (unique[0] !== xMin) unique.unshift(xMin);
  return unique.slice(0, 8);
}

/** Indices that receive visible circle markers (max ~60). */
export function markerPointIndices(n: number, maxMarkers = 60): number[] {
  if (n <= 0) return [];
  if (n <= maxMarkers) return Array.from({ length: n }, (_, i) => i);
  const step = Math.ceil(n / maxMarkers);
  const out: number[] = [];
  for (let i = 0; i < n; i += step) out.push(i);
  if (out[out.length - 1] !== n - 1) out.push(n - 1);
  return out;
}

/** Point indices to annotate with value labels (first, last, min, max; all if n≤12). */
export function valueLabelIndices(points: DataPoint[]): number[] {
  const n = points.length;
  if (n === 0) return [];
  if (n <= 12) return Array.from({ length: n }, (_, i) => i);

  let minI = 0;
  let maxI = 0;
  for (let i = 1; i < n; i++) {
    if (points[i].value < points[minI].value) minI = i;
    if (points[i].value > points[maxI].value) maxI = i;
  }
  const set = new Set([0, n - 1, minI, maxI]);
  return [...set].sort((a, b) => a - b);
}

export function renderSvgChart(
  metric: string,
  points: DataPoint[],
  type: ChartType,
  theme: ChartTheme,
): string {
  const W = 640;
  const H = 320;
  const pad = { t: 36, r: 28, b: 56, l: 60 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const t = THEMES[theme];
  const titleFill = theme === "dark" ? "#f4f4f7" : "#1a1a1a";

  if (points.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="100%" height="100%" fill="${t.bg}"/>
  <text x="${W / 2}" y="${H / 2}" text-anchor="middle" fill="${t.text}" font-family="system-ui,sans-serif" font-size="14">No data for ${escapeXml(metric)}</text>
</svg>`;
  }

  const xs = points.map((p) => p.ts);
  const ys = points.map((p) => p.value);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const spanSec = xMax - xMin;
  const yPad = (yMax - yMin) * 0.12 || 1;
  const y0 = yMin - yPad;
  const y1 = yMax + yPad;

  const scaleX = (ts: number) =>
    pad.l + ((ts - xMin) / (xMax - xMin || 1)) * innerW;
  const scaleY = (v: number) =>
    pad.t + innerH - ((v - y0) / (y1 - y0 || 1)) * innerH;

  const coords = points.map(
    (p) => `${scaleX(p.ts).toFixed(2)},${scaleY(p.value).toFixed(2)}`,
  );

  const baseY = pad.t + innerH;

  let series = "";
  if (type === "bar" && points.length <= 120) {
    const barW = Math.max(2, innerW / points.length - 1);
    series = points
      .map((p) => {
        const x = scaleX(p.ts) - barW / 2;
        const y = scaleY(p.value);
        const h = baseY - y;
        return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barW.toFixed(2)}" height="${h.toFixed(2)}" fill="${t.stroke}" opacity="0.85"/>`;
      })
      .join("\n  ");
  } else if (type === "area") {
    const areaPath = `M ${coords[0]} L ${coords.slice(1).join(" L ")} L ${scaleX(points[points.length - 1].ts).toFixed(2)},${baseY.toFixed(2)} L ${scaleX(points[0].ts).toFixed(2)},${baseY.toFixed(2)} Z`;
    series = `<path d="${areaPath}" fill="${t.fill}" stroke="none"/>
  <polyline fill="none" stroke="${t.stroke}" stroke-width="2" stroke-linejoin="round" points="${coords.join(" ")}"/>`;
  } else {
    series = `<polyline fill="none" stroke="${t.stroke}" stroke-width="2" stroke-linejoin="round" points="${coords.join(" ")}"/>`;
  }

  const gridLines = 4;
  const yGrid = Array.from({ length: gridLines + 1 }, (_, i) => {
    const v = y0 + ((y1 - y0) * i) / gridLines;
    const y = scaleY(v);
    return `<line x1="${pad.l}" y1="${y.toFixed(2)}" x2="${W - pad.r}" y2="${y.toFixed(2)}" stroke="${t.grid}"/>
  <text x="${pad.l - 6}" y="${(y + 4).toFixed(2)}" text-anchor="end" fill="${t.text}" font-size="10" font-family="ui-monospace,monospace">${formatNumber(v)}</text>`;
  }).join("\n  ");

  const xTicks = pickXAxisTicks(xMin, xMax, innerW);
  const xAxisY = baseY.toFixed(2);
  const xBaseline = `<line x1="${pad.l}" y1="${xAxisY}" x2="${W - pad.r}" y2="${xAxisY}" stroke="${t.grid}"/>`;
  const xTickEls = xTicks
    .map((tickTs, i) => {
      const x = scaleX(tickTs);
      const anchor =
        i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle";
      const label = formatXAxisTick(tickTs, spanSec);
      return `<line x1="${x.toFixed(2)}" y1="${xAxisY}" x2="${x.toFixed(2)}" y2="${(baseY + 5).toFixed(2)}" stroke="${t.text}" opacity="0.45"/>
  <text x="${x.toFixed(2)}" y="${(baseY + 18).toFixed(2)}" text-anchor="${anchor}" fill="${t.text}" font-size="10" font-family="ui-monospace,monospace">${escapeXml(label)}</text>`;
    })
    .join("\n  ");

  const markerIdx = markerPointIndices(points.length);
  const markers = markerIdx
    .map((i) => {
      const p = points[i];
      const cx = scaleX(p.ts).toFixed(2);
      const cy = scaleY(p.value).toFixed(2);
      const tip = escapeXml(formatMarkerTooltip(p.ts, p.value));
      return `<circle cx="${cx}" cy="${cy}" r="3.5" fill="${t.stroke}" stroke="${t.bg}" stroke-width="1.5"><title>${tip}</title></circle>`;
    })
    .join("\n  ");

  const labelIdx = valueLabelIndices(points);
  const placedLabels: { x: number; y: number }[] = [];
  const valueLabels = labelIdx
    .map((i) => {
      const p = points[i];
      let x = scaleX(p.ts);
      let y = scaleY(p.value) - 10;
      if (i === 0) x += 4;
      if (i === points.length - 1) x -= 4;
      for (const prev of placedLabels) {
        if (Math.hypot(x - prev.x, y - prev.y) < 22) y -= 14;
      }
      placedLabels.push({ x, y });
      const anchor =
        i === 0 ? "start" : i === points.length - 1 ? "end" : "middle";
      return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" text-anchor="${anchor}" fill="${titleFill}" font-size="9" font-family="ui-monospace,monospace" opacity="0.92">${formatNumber(p.value)}</text>`;
    })
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="100%" height="100%" fill="${t.bg}" rx="8"/>
  <text x="${pad.l}" y="22" fill="${titleFill}" font-family="system-ui,sans-serif" font-size="15" font-weight="600">${escapeXml(formatMetricLabel(metric))}</text>
  <text x="${W - pad.r}" y="22" text-anchor="end" fill="${t.text}" font-size="11" font-family="system-ui,sans-serif">graphmyanything</text>
  ${yGrid}
  ${xBaseline}
  ${xTickEls}
  ${series}
  ${markers}
  ${valueLabels}
</svg>`;
}

export function writeChartFile(
  metric: string,
  svg: string,
  outDir?: string,
): string {
  const dir = outDir ?? resolveChartsDir();
  fs.mkdirSync(dir, { recursive: true });
  const safe = metric.replace(/[^a-zA-Z0-9._-]/g, "_");
  const file = path.join(dir, `${safe}-${Date.now()}.svg`);
  fs.writeFileSync(file, svg, "utf8");
  return file;
}