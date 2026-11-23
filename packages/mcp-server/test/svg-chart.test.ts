import { describe, expect, it } from "vitest";
import type { DataPoint } from "../src/lib/lttb.js";
import {
  boxesOverlap,
  circleOverlapsBox,
  formatMarkerTooltip,
  formatXAxisTick,
  labelBoxForText,
  markerPointIndices,
  niceYAxisTicks,
  parseMarkerCircles,
  parseValueLabelBoxes,
  pickXAxisTicks,
  renderSvgChart,
  valueLabelIndicesForMode,
  xAxisTimeGranularity,
} from "../src/lib/svg-chart.js";

function planoPopulation29(): DataPoint[] {
  return Array.from({ length: 29 }, (_, i) => ({
    ts: Date.UTC(1995, 0, 1) / 1000 + i * 365 * 86_400,
    value: 184_600 + i * 4_000 + (i > 25 ? 108_000 : 0),
  }));
}

function weight4(): DataPoint[] {
  const base = Date.UTC(2025, 0, 6) / 1000;
  return [
    { ts: base, value: 182.4 },
    { ts: base + 7 * 86_400, value: 181.1 },
    { ts: base + 14 * 86_400, value: 180.6 },
    { ts: base + 21 * 86_400, value: 179.8 },
  ];
}

function series200(): DataPoint[] {
  const start = Date.UTC(2020, 0, 1) / 1000;
  return Array.from({ length: 200 }, (_, i) => ({
    ts: start + i * 86_400,
    value: 50 + Math.sin(i / 12) * 20 + i * 0.1,
  }));
}

function assertNoLabelOverlaps(svg: string): void {
  const labels = parseValueLabelBoxes(svg);
  const markers = parseMarkerCircles(svg);
  for (let i = 0; i < labels.length; i++) {
    for (let j = i + 1; j < labels.length; j++) {
      expect(boxesOverlap(labels[i], labels[j])).toBe(false);
    }
    for (const m of markers) {
      expect(circleOverlapsBox(m.cx, m.cy, m.r, labels[i])).toBe(false);
    }
  }
}

describe("xAxisTimeGranularity", () => {
  it("classifies multi-year as yearly", () => {
    expect(xAxisTimeGranularity(30 * 365 * 86_400)).toBe("yearly");
  });
  it("classifies monthly span", () => {
    expect(xAxisTimeGranularity(90 * 86_400)).toBe("monthly");
  });
  it("classifies daily span", () => {
    expect(xAxisTimeGranularity(14 * 86_400)).toBe("daily");
  });
  it("classifies intraday", () => {
    expect(xAxisTimeGranularity(6 * 3600)).toBe("intraday");
  });
});

describe("formatXAxisTick", () => {
  const y1995 = Date.UTC(1995, 0, 1) / 1000;
  const y2025 = Date.UTC(2025, 0, 1) / 1000;

  it("formats years for multi-year series", () => {
    const span = 30 * 365 * 86_400;
    expect(formatXAxisTick(y1995, span)).toBe("1995");
    expect(formatXAxisTick(y2025, span)).toBe("2025");
  });

  it("formats month/day for short spans", () => {
    const span = 10 * 86_400;
    const ts = Date.UTC(2024, 2, 15) / 1000;
    expect(formatXAxisTick(ts, span)).toMatch(/3\/15/);
  });

  it("formats times for intraday", () => {
    const span = 4 * 3600;
    const ts = Date.UTC(2024, 0, 1, 14, 30) / 1000;
    expect(formatXAxisTick(ts, span)).toBe("14:30");
  });
});

describe("formatMarkerTooltip", () => {
  it("uses year only for multi-year spans", () => {
    const ts = Date.UTC(1996, 0, 1) / 1000;
    const tip = formatMarkerTooltip(ts, 192_600, 30 * 365 * 86_400);
    expect(tip).toBe("1996 — 192.6k");
    expect(tip).not.toContain("UTC");
  });

  it("uses month day year for daily spans", () => {
    const ts = Date.UTC(1996, 6, 1) / 1000;
    const tip = formatMarkerTooltip(ts, 100, 14 * 86_400);
    expect(tip).toMatch(/Jul 1, 1996/);
    expect(tip).not.toContain("UTC");
  });
});

describe("pickXAxisTicks", () => {
  it("includes first and last and yields 5–8 ticks", () => {
    const ticks = pickXAxisTicks(1_700_000_000, 1_730_000_000, 520);
    expect(ticks[0]).toBe(1_700_000_000);
    expect(ticks[ticks.length - 1]).toBe(1_730_000_000);
    expect(ticks.length).toBeGreaterThanOrEqual(5);
    expect(ticks.length).toBeLessThanOrEqual(8);
  });

  it("uses exact point timestamps when n ≤ 12", () => {
    const base = Date.UTC(2025, 0, 6) / 1000;
    const pts: DataPoint[] = [0, 1, 2, 3].map((w) => ({
      ts: base + w * 7 * 86_400,
      value: 180 - w,
    }));
    const ticks = pickXAxisTicks(pts[0].ts, pts[3].ts, 520, pts);
    expect(ticks).toEqual(pts.map((p) => p.ts));
  });

  it("ends multi-year series on the last data timestamp", () => {
    const start = Date.UTC(1995, 0, 1) / 1000;
    const end = Date.UTC(2024, 0, 1) / 1000;
    const ticks = pickXAxisTicks(start, end, 520);
    expect(ticks[ticks.length - 1]).toBe(end);
    expect(formatXAxisTick(ticks[ticks.length - 1], end - start)).toBe("2024");
  });
});

describe("niceYAxisTicks", () => {
  it("uses round steps for weight-scale data", () => {
    const { ticks, y0, y1 } = niceYAxisTicks(179.8, 182.4, 5);
    expect(y0).toBeLessThanOrEqual(179.8);
    expect(y1).toBeGreaterThanOrEqual(182.4);
    for (let i = 1; i < ticks.length; i++) {
      const step = ticks[i] - ticks[i - 1];
      expect(
        [0.5, 1, 2, 2.5, 5, 10].some(
          (s) => Math.abs(step - s) < 1e-6 || (step / s > 0.99 && step / s < 1.01),
        ),
      ).toBe(true);
    }
    expect(ticks.some((t) => t === 180 || t === 179.5 || t === 181)).toBe(true);
  });

  it("uses k/M-friendly steps for large populations", () => {
    const { ticks, y0, y1 } = niceYAxisTicks(128_400, 297_100, 5);
    expect(y0).toBeLessThan(128_400);
    expect(y1).toBeGreaterThan(297_100);
    const step = ticks[1] - ticks[0];
    expect(step).toBeGreaterThanOrEqual(25_000);
    expect(step % 25_000).toBe(0);
  });
});

describe("markerPointIndices", () => {
  it("includes every index when n ≤ 60", () => {
    expect(markerPointIndices(29)).toHaveLength(29);
    expect(markerPointIndices(60)).toHaveLength(60);
  });

  it("thins markers above 60", () => {
    const idx = markerPointIndices(120);
    expect(idx.length).toBeLessThanOrEqual(61);
    expect(idx[0]).toBe(0);
    expect(idx[idx.length - 1]).toBe(119);
  });
});

describe("valueLabelIndicesForMode", () => {
  const pts: DataPoint[] = [
    { ts: 1, value: 100 },
    { ts: 2, value: 50 },
    { ts: 3, value: 200 },
    { ts: 4, value: 75 },
  ];

  it("last mode returns only final index", () => {
    expect(valueLabelIndicesForMode(pts, "last")).toEqual([3]);
  });

  it("all mode labels every point", () => {
    expect(valueLabelIndicesForMode(pts, "all")).toEqual([0, 1, 2, 3]);
  });

  it("extremes labels first, last, min, max for larger n", () => {
    const many: DataPoint[] = Array.from({ length: 30 }, (_, i) => ({
      ts: i,
      value: i === 5 ? 1 : i === 25 ? 999 : 50,
    }));
    const labels = valueLabelIndicesForMode(many, "extremes");
    expect(labels).toContain(0);
    expect(labels).toContain(29);
    expect(labels).toContain(5);
    expect(labels).toContain(25);
  });
});

describe("label collision safety", () => {
  it("Plano-shaped 29y series: no overlapping value labels or markers", () => {
    const svg = renderSvgChart(
      "city.plano.population",
      planoPopulation29(),
      "line",
      "light",
      "last",
    );
    const labels = parseValueLabelBoxes(svg);
    expect(labels.length).toBeLessThanOrEqual(1);
    assertNoLabelOverlaps(svg);
  });

  it("4-point weight series (labels all)", () => {
    const svg = renderSvgChart(
      "health.weight.lb",
      weight4(),
      "line",
      "light",
      "all",
    );
    assertNoLabelOverlaps(svg);
  });

  it("200-point series (labels last default)", () => {
    const svg = renderSvgChart(
      "ops.latency.ms",
      series200(),
      "line",
      "dark",
      "last",
    );
    assertNoLabelOverlaps(svg);
    expect(markerPointIndices(200).length).toBeLessThan(200);
  });

  it("extremes mode avoids collisions on Plano series", () => {
    const svg = renderSvgChart(
      "city.plano.population",
      planoPopulation29(),
      "line",
      "dark",
      "extremes",
    );
    assertNoLabelOverlaps(svg);
  });
});

describe("renderSvgChart markup", () => {
  it("includes x-axis ticks, markers, and axis baseline", () => {
    const svg = renderSvgChart(
      "city.plano.population",
      planoPopulation29(),
      "line",
      "dark",
    );
    expect(svg).toContain("<title>");
    expect(svg).toMatch(/1995/);
    expect(svg).toContain("<circle");
    expect(svg.match(/<circle/g)?.length).toBe(29);
  });

  it("labels each weight point date on the x-axis when n ≤ 12", () => {
    const svg = renderSvgChart("health.weight.lb", weight4(), "line", "light");
    expect(svg).toContain("1/6");
    expect(svg).toContain("1/13");
    expect(svg).toContain("1/20");
    expect(svg).toContain("1/27");
  });

  it("tooltip on marker uses friendly year for Plano", () => {
    const svg = renderSvgChart(
      "city.plano.population",
      planoPopulation29(),
      "line",
      "light",
    );
    expect(svg).toMatch(/<title>1996 —/);
    expect(svg).not.toMatch(/UTC —/);
  });
});

describe("labelBoxForText", () => {
  it("width scales with char count", () => {
    const short = labelBoxForText(100, 50, "middle", "1.0k", 9);
    const long = labelBoxForText(100, 50, "middle", "293.4k", 9);
    expect(long.x1 - long.x0).toBeGreaterThan(short.x1 - short.x0);
  });
});