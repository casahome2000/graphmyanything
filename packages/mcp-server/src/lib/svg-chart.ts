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

function formatMetricLabel(metric: string): string {
  return metric.replace(/\./g, " · ");
}

export function renderSvgChart(
  metric: string,
  points: DataPoint[],
  type: ChartType,
  theme: ChartTheme,
): string {
  const W = 640;
  const H = 320;
  const pad = { t: 36, r: 24, b: 44, l: 56 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const t = THEMES[theme];

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
  const yPad = (yMax - yMin) * 0.08 || 1;
  const y0 = yMin - yPad;
  const y1 = yMax + yPad;

  const scaleX = (ts: number) =>
    pad.l + ((ts - xMin) / (xMax - xMin || 1)) * innerW;
  const scaleY = (v: number) =>
    pad.t + innerH - ((v - y0) / (y1 - y0 || 1)) * innerH;

  const coords = points.map((p) => `${scaleX(p.ts).toFixed(2)},${scaleY(p.value).toFixed(2)}`);

  let series = "";
  if (type === "bar" && points.length <= 120) {
    const barW = Math.max(2, innerW / points.length - 1);
    series = points
      .map((p) => {
        const x = scaleX(p.ts) - barW / 2;
        const y = scaleY(p.value);
        const h = pad.t + innerH - y;
        return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barW.toFixed(2)}" height="${h.toFixed(2)}" fill="${t.stroke}" opacity="0.85"/>`;
      })
      .join("\n  ");
  } else if (type === "area") {
    const line = coords.join(" ");
    const baseY = (pad.t + innerH).toFixed(2);
    const areaPath = `M ${coords[0]} L ${line.replace(/ /g, " L ")} L ${scaleX(points[points.length - 1].ts).toFixed(2)},${baseY} L ${scaleX(points[0].ts).toFixed(2)},${baseY} Z`;
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
  <text x="${pad.l - 8}" y="${(y + 4).toFixed(2)}" text-anchor="end" fill="${t.text}" font-size="10" font-family="ui-monospace,monospace">${formatNumber(v)}</text>`;
  }).join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="100%" height="100%" fill="${t.bg}" rx="8"/>
  <text x="${pad.l}" y="22" fill="#f4f4f7" font-family="system-ui,sans-serif" font-size="15" font-weight="600">${escapeXml(formatMetricLabel(metric))}</text>
  <text x="${W - pad.r}" y="22" text-anchor="end" fill="${t.text}" font-size="11" font-family="system-ui,sans-serif">graphmyanything</text>
  ${yGrid}
  ${series}
</svg>`;
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