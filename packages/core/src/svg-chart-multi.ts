import type { DataPoint } from "./lttb.js";
import {
  type ChartLabelsMode,
  type ChartTheme,
  type ChartType,
  CHART_THEMES,
  escapeXml,
  formatMarkerTooltip,
  formatMetricLabel,
  formatNumber,
  formatXAxisTick,
  layoutValueLabels,
  markerPointIndices,
  niceYAxisTicks,
  pickXAxisTicks,
  thinXTickCollisions,
  type PlacedValueLabel,
  type PlotBounds,
  TITLE_BOTTOM_Y,
} from "./svg-chart.js";

const W = 640;
const H = 320;
const MARKER_R = 3.5;
const MARKER_HIT_R = 14;
const LABEL_FONT_SIZE = 9;

export type ChartSeriesRenderInput = {
  label: string;
  color: string;
  points: DataPoint[];
};

export function renderSvgMultiSeriesChart(
  title: string,
  series: ChartSeriesRenderInput[],
  type: ChartType,
  theme: ChartTheme,
  labelsMode: ChartLabelsMode = "last",
): string {
  const pad = { t: 36, r: 36, b: 72, l: 60 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const t = CHART_THEMES[theme];
  const titleFill = theme === "dark" ? "#f4f4f7" : "#1a1a1a";

  const nonEmpty = series.filter((s) => s.points.length > 0);
  if (nonEmpty.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="100%" height="100%" fill="${t.bg}"/>
  <text x="${W / 2}" y="${H / 2}" text-anchor="middle" fill="${t.text}" font-family="system-ui,sans-serif" font-size="14">No data for ${escapeXml(title)}</text>
</svg>`;
  }

  const allTs = nonEmpty.flatMap((s) => s.points.map((p) => p.ts));
  const allVals = nonEmpty.flatMap((s) => s.points.map((p) => p.value));
  const xMin = Math.min(...allTs);
  const xMax = Math.max(...allTs);
  const spanSec = xMax - xMin;
  const yMin = Math.min(...allVals);
  const yMax = Math.max(...allVals);
  const { y0, y1, ticks: yTicks } = niceYAxisTicks(yMin, yMax, 5);

  const scaleX = (ts: number) =>
    pad.l + ((ts - xMin) / (xMax - xMin || 1)) * innerW;
  const scaleY = (v: number) =>
    pad.t + innerH - ((v - y0) / (y1 - y0 || 1)) * innerH;
  const baseY = pad.t + innerH;

  const yGrid = yTicks
    .map((v) => {
      const y = scaleY(v);
      return `<line x1="${pad.l}" y1="${y.toFixed(2)}" x2="${W - pad.r}" y2="${y.toFixed(2)}" stroke="${t.grid}"/>
  <text x="${pad.l - 6}" y="${(y + 4).toFixed(2)}" text-anchor="end" fill="${t.text}" font-size="10" font-family="ui-monospace,monospace">${formatNumber(v)}</text>`;
    })
    .join("\n  ");

  let xTicks = pickXAxisTicks(xMin, xMax, innerW);
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

  const plot: PlotBounds = {
    left: pad.l,
    right: W - pad.r,
    top: TITLE_BOTTOM_Y,
    bottom: baseY - 4,
  };

  let seriesSvg = "";
  const allMarkers: string[] = [];
  const allValueLabels: PlacedValueLabel[] = [];

  for (const s of nonEmpty) {
    const points = s.points;
    const stroke = s.color;
    const coords = points.map(
      (p) => `${scaleX(p.ts).toFixed(2)},${scaleY(p.value).toFixed(2)}`,
    );

    if (type === "bar" && points.length <= 120 && nonEmpty.length === 1) {
      const barW = Math.max(2, innerW / points.length - 1);
      seriesSvg += points
        .map((p) => {
          const x = scaleX(p.ts) - barW / 2;
          const y = scaleY(p.value);
          const h = baseY - y;
          return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barW.toFixed(2)}" height="${h.toFixed(2)}" fill="${stroke}" opacity="0.85"/>`;
        })
        .join("\n  ");
    } else if (type === "area" && nonEmpty.length === 1) {
      const areaPath = `M ${coords[0]} L ${coords.slice(1).join(" L ")} L ${scaleX(points[points.length - 1]!.ts).toFixed(2)},${baseY.toFixed(2)} L ${scaleX(points[0]!.ts).toFixed(2)},${baseY.toFixed(2)} Z`;
      seriesSvg += `<path d="${areaPath}" fill="${stroke}33" stroke="none"/>
  <polyline fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round" points="${coords.join(" ")}"/>`;
    } else {
      seriesSvg += `<polyline fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round" points="${coords.join(" ")}"/>`;
    }

    const markerIdx = markerPointIndices(points.length);
    allMarkers.push(
      ...markerIdx.map((i) => {
        const p = points[i]!;
        const cx = scaleX(p.ts).toFixed(2);
        const cy = scaleY(p.value).toFixed(2);
        const tip = `${s.label}: ${formatMarkerTooltip(p.ts, p.value, spanSec)}`;
        const tipXml = escapeXml(tip);
        return `<g class="gma-marker" role="graphics-symbol" aria-label="${escapeXml(tip)}">
  <circle class="gma-marker-hit" cx="${cx}" cy="${cy}" r="${MARKER_HIT_R}" fill="transparent" stroke="none"><title>${tipXml}</title></circle>
  <circle cx="${cx}" cy="${cy}" r="${MARKER_R}" fill="${stroke}" stroke="${t.bg}" stroke-width="1.5" pointer-events="none"><title>${tipXml}</title></circle>
</g>`;
      }),
    );

    if (nonEmpty.length === 1) {
      allValueLabels.push(
        ...layoutValueLabels(
          points,
          labelsMode,
          scaleX,
          scaleY,
          markerIdx,
          plot,
        ),
      );
    }
  }

  const valueLabels =
    nonEmpty.length === 1
      ? allValueLabels
          .map(
            (lbl) =>
              `<text x="${lbl.x.toFixed(2)}" y="${lbl.y.toFixed(2)}" text-anchor="${lbl.anchor}" fill="${titleFill}" font-size="${LABEL_FONT_SIZE}" font-family="ui-monospace,monospace" opacity="0.88">${lbl.text}</text>`,
          )
          .join("\n  ")
      : "";

  const legendY = H - 22;
  const legend = nonEmpty
    .map((s, i) => {
      const x = pad.l + i * 128;
      return `<line x1="${x}" y1="${legendY}" x2="${x + 20}" y2="${legendY}" stroke="${s.color}" stroke-width="3"/>
  <text x="${x + 26}" y="${legendY + 4}" fill="${t.text}" font-size="10" font-family="system-ui,sans-serif">${escapeXml(formatMetricLabel(s.label))}</text>`;
    })
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="100%" height="100%" fill="${t.bg}" rx="8"/>
  <text x="${pad.l}" y="22" fill="${titleFill}" font-family="system-ui,sans-serif" font-size="15" font-weight="600">${escapeXml(formatMetricLabel(title))}</text>
  <text x="${W - pad.r}" y="22" text-anchor="end" fill="${t.text}" font-size="11" font-family="system-ui,sans-serif">graphmyanything</text>
  ${yGrid}
  ${xBaseline}
  ${xTickEls}
  ${seriesSvg}
  ${allMarkers.join("\n  ")}
  ${valueLabels}
  <g role="list" aria-label="Chart legend">${legend}</g>
</svg>`;
}