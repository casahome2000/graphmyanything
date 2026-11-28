import type { DataPoint } from "./lttb.js";

export type ChartType = "line" | "bar" | "area";
export type ChartTheme = "dark" | "light";
export type ChartLabelsMode = "none" | "last" | "extremes" | "all";

export const CHART_THEMES: Record<
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

const SEC_DAY = 86_400;
const SEC_YEAR = 365 * SEC_DAY;
const MARKER_R = 3.5;
const LABEL_FONT_SIZE = 9;
export const TITLE_BOTTOM_Y = 30;

export function formatMetricLabel(metric: string): string {
  return metric.replace(/\./g, " · ");
}

export function formatNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(n % 1 === 0 ? 0 : 2);
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function xAxisTimeGranularity(
  spanSec: number,
): "intraday" | "daily" | "monthly" | "yearly" {
  if (spanSec <= 2 * SEC_DAY) return "intraday";
  if (spanSec <= 45 * SEC_DAY) return "daily";
  if (spanSec <= 3 * SEC_YEAR) return "monthly";
  return "yearly";
}

export function formatXAxisTick(ts: number, spanSec: number): string {
  const g = xAxisTimeGranularity(spanSec);
  const d = new Date(ts * 1000);
  if (g === "yearly") return String(d.getUTCFullYear());
  if (g === "monthly") {
    const yr = d.getUTCFullYear();
    const mon = MS_MONTHS[d.getUTCMonth()];
    return spanSec > SEC_YEAR
      ? `${mon} '${String(yr).slice(-2)}`
      : `${mon} ${d.getUTCDate()}`;
  }
  if (g === "daily") {
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  }
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Human-readable date + value for marker tooltips (granularity matches the series span). */
export function formatMarkerTooltip(
  ts: number,
  value: number,
  spanSec: number,
): string {
  const g = xAxisTimeGranularity(spanSec);
  const d = new Date(ts * 1000);
  let datePart: string;
  if (g === "yearly") {
    datePart = String(d.getUTCFullYear());
  } else if (g === "intraday") {
    const h = d.getUTCHours();
    const m = d.getUTCMinutes();
    datePart = `${MS_MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  } else {
    datePart = `${MS_MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  }
  return `${datePart} — ${formatNumber(value)}`;
}

function niceStepCeil(rawStep: number): number {
  if (rawStep <= 0 || !Number.isFinite(rawStep)) return 1;
  const exp = Math.floor(Math.log10(rawStep));
  const mag = 10 ** exp;
  const norm = rawStep / mag;
  let mult = 10;
  if (norm <= 1) mult = 1;
  else if (norm <= 2) mult = 2;
  else if (norm <= 2.5) mult = 2.5;
  else if (norm <= 5) mult = 5;
  return mult * mag;
}

/**
 * Y-axis domain and tick values on 1/2/2.5/5×10ⁿ steps; extra headroom above data for labels/title.
 */
export function niceYAxisTicks(
  dataMin: number,
  dataMax: number,
  targetTicks = 5,
): { y0: number; y1: number; ticks: number[] } {
  if (dataMin === dataMax) {
    const bump = Math.abs(dataMin) * 0.08 || 1;
    dataMin -= bump;
    dataMax += bump;
  }
  const span = dataMax - dataMin;
  const margin = span * 0.06 || Math.abs(dataMax) * 0.02 || 0.5;
  const topExtra = span * 0.08 || Math.abs(dataMax) * 0.02 || 0.5;
  const wantLo = dataMin - margin;
  const wantHi = dataMax + margin + topExtra;
  const rawRange = wantHi - wantLo;
  const step = niceStepCeil(rawRange / Math.max(2, targetTicks - 1));
  let y0 = Math.floor(wantLo / step) * step;
  let y1 = Math.ceil(wantHi / step) * step;
  while (y0 > dataMin - margin * 0.25) y0 -= step;
  while (y1 < dataMax + margin + topExtra * 0.5) y1 += step;

  const ticks: number[] = [];
  for (let v = y0; v <= y1 + step * 1e-9; v += step) {
    const r = Math.round(v * 1e9) / 1e9;
    ticks.push(r);
  }
  return { y0, y1, ticks };
}

function pickYearlyXTicks(
  xMin: number,
  xMax: number,
  innerWidthPx: number,
): number[] {
  const yStart = new Date(xMin * 1000).getUTCFullYear();
  const yEnd = new Date(xMax * 1000).getUTCFullYear();
  const yearSpan = Math.max(0, yEnd - yStart);
  const minLabelPx = 52;
  const maxTicks = Math.min(8, Math.max(5, Math.floor(innerWidthPx / minLabelPx)));
  let yearStep = 1;
  const steps = [1, 2, 5, 10, 20, 25];
  for (const s of steps) {
    yearStep = s;
    const n = Math.floor(yearSpan / s) + 1;
    if (n + 2 <= maxTicks) break;
  }
  const out: number[] = [xMin];
  const firstLabeled = Math.ceil(yStart / yearStep) * yearStep;
  for (let y = firstLabeled; y < yEnd; y += yearStep) {
    const ts = Date.UTC(y, 0, 1) / 1000;
    if (ts > xMin && ts < xMax) out.push(ts);
  }
  out.push(xMax);
  const uniq = [...new Set(out)].sort((a, b) => a - b);
  if (uniq.length > maxTicks) {
    const stride = Math.ceil(uniq.length / maxTicks);
    const thinned = uniq.filter(
      (_, i) => i === 0 || i === uniq.length - 1 || i % stride === 0,
    );
    if (thinned[thinned.length - 1] !== xMax) thinned.push(xMax);
    return thinned.slice(0, maxTicks);
  }
  return uniq;
}

export function thinXTickCollisions(
  ticks: number[],
  innerW: number,
  xMin: number,
  xMax: number,
): number[] {
  if (ticks.length <= 2) return ticks;
  const minPx = Math.max(56, approxTextWidth("Sep '26", 10));
  const scaleX = (ts: number) => ((ts - xMin) / (xMax - xMin || 1)) * innerW;
  const out: number[] = [ticks[0]!];
  for (let i = 1; i < ticks.length - 1; i++) {
    const t = ticks[i]!;
    if (scaleX(t) - scaleX(out[out.length - 1]!) >= minPx) {
      out.push(t);
    }
  }
  if (ticks[ticks.length - 1] !== out[out.length - 1]) {
    out.push(ticks[ticks.length - 1]!);
  }
  return out.slice(0, 8);
}

export function pickXAxisTicks(
  xMin: number,
  xMax: number,
  innerWidthPx: number,
  points?: DataPoint[],
): number[] {
  if (points && points.length > 0 && points.length <= 12) {
    return points.map((p) => p.ts);
  }

  const span = xMax - xMin;
  if (span <= 0) return [xMin];
  if (xAxisTimeGranularity(span) === "yearly") {
    return pickYearlyXTicks(xMin, xMax, innerWidthPx);
  }

  const minLabelPx = 52;
  const maxTicks = Math.min(8, Math.max(5, Math.floor(innerWidthPx / minLabelPx)));
  const count = Math.max(2, maxTicks);

  const ticks: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = xMin + (span * i) / (count - 1);
    ticks.push(i === 0 ? xMin : i === count - 1 ? xMax : Math.round(t));
  }
  ticks[0] = xMin;
  ticks[ticks.length - 1] = xMax;

  const unique: number[] = [];
  for (const t of ticks) {
    if (
      unique.length === 0 ||
      t - unique[unique.length - 1] >= Math.max(1, span / (count * 3))
    ) {
      unique.push(t);
    }
  }
  if (unique[unique.length - 1] !== xMax) unique.push(xMax);
  if (unique[0] !== xMin) unique.unshift(xMin);
  return unique.slice(0, 8);
}

export function markerPointIndices(n: number, maxMarkers = 60): number[] {
  if (n <= 0) return [];
  if (n <= maxMarkers) return Array.from({ length: n }, (_, i) => i);
  const step = Math.ceil(n / maxMarkers);
  const out: number[] = [];
  for (let i = 0; i < n; i += step) out.push(i);
  if (out[out.length - 1] !== n - 1) out.push(n - 1);
  return out;
}

/** Which point indices to consider for value labels for a given mode. */
export function valueLabelIndicesForMode(
  points: DataPoint[],
  mode: ChartLabelsMode,
): number[] {
  const n = points.length;
  if (n === 0 || mode === "none") return [];
  if (mode === "last") return [n - 1];
  if (mode === "all") return Array.from({ length: n }, (_, i) => i);

  let minI = 0;
  let maxI = 0;
  for (let i = 1; i < n; i++) {
    if (points[i].value < points[minI].value) minI = i;
    if (points[i].value > points[maxI].value) maxI = i;
  }
  const set = new Set([0, n - 1, minI, maxI]);
  return [...set].sort((a, b) => a - b);
}

/** @deprecated use valueLabelIndicesForMode */
export function valueLabelIndices(points: DataPoint[]): number[] {
  return valueLabelIndicesForMode(points, "extremes");
}

export type TextAnchor = "start" | "middle" | "end";

export type LabelBox = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
};

export function approxTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.6;
}

export function labelBoxForText(
  x: number,
  y: number,
  anchor: TextAnchor,
  text: string,
  fontSize: number,
): LabelBox {
  const w = approxTextWidth(text, fontSize);
  const h = fontSize * 1.15;
  let x0: number;
  if (anchor === "start") x0 = x;
  else if (anchor === "end") x0 = x - w;
  else x0 = x - w / 2;
  const y0 = y - h;
  return { x0, y0, x1: x0 + w, y1: y0 + h };
}

export function boxesOverlap(a: LabelBox, b: LabelBox): boolean {
  return !(a.x1 < b.x0 || b.x1 < a.x0 || a.y1 < b.y0 || b.y1 < a.y0);
}

export function circleOverlapsBox(
  cx: number,
  cy: number,
  r: number,
  box: LabelBox,
): boolean {
  const closestX = Math.max(box.x0, Math.min(cx, box.x1));
  const closestY = Math.max(box.y0, Math.min(cy, box.y1));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < (r + 1) * (r + 1);
}

export type PlacedValueLabel = {
  index: number;
  x: number;
  y: number;
  anchor: TextAnchor;
  text: string;
  box: LabelBox;
};

export type PlotBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

function labelCandidatesForPoint(
  index: number,
  n: number,
  cx: number,
  cy: number,
  mode: ChartLabelsMode,
  plot: PlotBounds,
): { x: number; y: number; anchor: TextAnchor }[] {
  const isLast = index === n - 1;
  const isFirst = index === 0;
  if (mode === "last" && isLast) {
    return [
      { x: plot.right, y: cy + 4, anchor: "end" },
      { x: cx + MARKER_R + 6, y: cy + 3, anchor: "start" },
      { x: cx - MARKER_R - 6, y: cy + 3, anchor: "end" },
      { x: cx - MARKER_R - 6, y: cy + MARKER_R + 18, anchor: "end" },
      { x: cx, y: cy + MARKER_R + 20, anchor: "middle" },
      { x: cx, y: cy - MARKER_R - 12, anchor: "middle" },
    ];
  }
  const cands: { x: number; y: number; anchor: TextAnchor }[] = [
    { x: cx, y: cy - MARKER_R - 10, anchor: "middle" },
    { x: cx, y: cy + MARKER_R + 14, anchor: "middle" },
    { x: cx + MARKER_R + 6, y: cy + 3, anchor: "start" },
    { x: cx - MARKER_R - 6, y: cy + 3, anchor: "end" },
  ];
  if (isFirst) {
    cands.unshift({ x: cx + 4, y: cy - MARKER_R - 10, anchor: "start" });
  }
  if (isLast) {
    cands.unshift({ x: cx - 4, y: cy - MARKER_R - 10, anchor: "end" });
  }
  return cands;
}

function boxInsidePlot(box: LabelBox, plot: PlotBounds): boolean {
  return (
    box.x0 >= plot.left - 1 &&
    box.x1 <= plot.right + 1 &&
    box.y0 >= plot.top &&
    box.y1 <= plot.bottom
  );
}

function boxClearsTitle(box: LabelBox): boolean {
  return box.y0 >= TITLE_BOTTOM_Y;
}

export function layoutValueLabels(
  points: DataPoint[],
  mode: ChartLabelsMode,
  scaleX: (ts: number) => number,
  scaleY: (v: number) => number,
  markerIndices: number[],
  plot: PlotBounds,
): PlacedValueLabel[] {
  const indices = valueLabelIndicesForMode(points, mode);
  const markers = markerIndices.map((i) => {
    const p = points[i];
    return { cx: scaleX(p.ts), cy: scaleY(p.value), r: MARKER_R };
  });
  const placed: PlacedValueLabel[] = [];

  for (const index of indices) {
    const p = points[index];
    const text = formatNumber(p.value);
    const cx = scaleX(p.ts);
    const cy = scaleY(p.value);
    const cands = labelCandidatesForPoint(index, points.length, cx, cy, mode, plot);
    let chosen: PlacedValueLabel | null = null;

    for (const c of cands) {
      const box = labelBoxForText(c.x, c.y, c.anchor, text, LABEL_FONT_SIZE);
      if (!boxInsidePlot(box, plot)) continue;
      if (!boxClearsTitle(box)) continue;
      let bad = false;
      for (const m of markers) {
        if (circleOverlapsBox(m.cx, m.cy, m.r, box)) {
          bad = true;
          break;
        }
      }
      if (bad) continue;
      for (const prev of placed) {
        if (boxesOverlap(box, prev.box)) {
          bad = true;
          break;
        }
      }
      if (!bad) {
        chosen = { index, x: c.x, y: c.y, anchor: c.anchor, text, box };
        break;
      }
    }
    if (chosen) placed.push(chosen);
  }
  return placed;
}

export function renderSvgChart(
  metric: string,
  points: DataPoint[],
  type: ChartType,
  theme: ChartTheme,
  labelsMode: ChartLabelsMode = "last",
): string {
  const W = 640;
  const H = 320;
  const pad = { t: 36, r: 36, b: 56, l: 60 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const t = CHART_THEMES[theme];
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
  const { y0, y1, ticks: yTicks } = niceYAxisTicks(yMin, yMax, 5);

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

  const yGrid = yTicks
    .map((v) => {
      const y = scaleY(v);
      return `<line x1="${pad.l}" y1="${y.toFixed(2)}" x2="${W - pad.r}" y2="${y.toFixed(2)}" stroke="${t.grid}"/>
  <text x="${pad.l - 6}" y="${(y + 4).toFixed(2)}" text-anchor="end" fill="${t.text}" font-size="10" font-family="ui-monospace,monospace">${formatNumber(v)}</text>`;
    })
    .join("\n  ");

  let xTicks = pickXAxisTicks(xMin, xMax, innerW, points);
  xTicks = thinXTickCollisions(xTicks, innerW, xMin, xMax);
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
      const tip = escapeXml(formatMarkerTooltip(p.ts, p.value, spanSec));
      return `<circle cx="${cx}" cy="${cy}" r="${MARKER_R}" fill="${t.stroke}" stroke="${t.bg}" stroke-width="1.5"><title>${tip}</title></circle>`;
    })
    .join("\n  ");

  const plot: PlotBounds = {
    left: pad.l,
    right: W - pad.r,
    top: TITLE_BOTTOM_Y,
    bottom: baseY - 4,
  };
  const valueLabelLayout = layoutValueLabels(
    points,
    labelsMode,
    scaleX,
    scaleY,
    markerIdx,
    plot,
  );
  const valueLabels = valueLabelLayout
    .map(
      (lbl) =>
        `<text x="${lbl.x.toFixed(2)}" y="${lbl.y.toFixed(2)}" text-anchor="${lbl.anchor}" fill="${titleFill}" font-size="${LABEL_FONT_SIZE}" font-family="ui-monospace,monospace" opacity="0.88">${lbl.text}</text>`,
    )
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
/** Extract marker positions from rendered SVG for overlap tests. */
export function parseMarkerCircles(svg: string): { cx: number; cy: number; r: number }[] {
  const re = /<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/g;
  const out: { cx: number; cy: number; r: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(svg)) !== null) {
    out.push({ cx: Number(m[1]), cy: Number(m[2]), r: Number(m[3]) });
  }
  return out;
}

/** Value label text elements from SVG (excludes axis monospace at y>240 typically). */
export function parseValueLabelBoxes(svg: string): LabelBox[] {
  const re =
    /<text x="([\d.]+)" y="([\d.]+)" text-anchor="(start|middle|end)"[^>]*font-size="9"[^>]*>([^<]+)<\/text>/g;
  const boxes: LabelBox[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(svg)) !== null) {
    const x = Number(m[1]);
    const y = Number(m[2]);
    const anchor = m[3] as TextAnchor;
    const text = m[4];
    boxes.push(labelBoxForText(x, y, anchor, text, LABEL_FONT_SIZE));
  }
  return boxes;
}