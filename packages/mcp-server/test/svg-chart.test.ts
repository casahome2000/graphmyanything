import { describe, expect, it } from "vitest";
import type { DataPoint } from "../src/lib/lttb.js";
import {
  formatXAxisTick,
  markerPointIndices,
  pickXAxisTicks,
  renderSvgChart,
  valueLabelIndices,
  xAxisTimeGranularity,
} from "../src/lib/svg-chart.js";

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

describe("pickXAxisTicks", () => {
  it("includes first and last and yields 5–8 ticks", () => {
    const ticks = pickXAxisTicks(1_700_000_000, 1_730_000_000, 520);
    expect(ticks[0]).toBe(1_700_000_000);
    expect(ticks[ticks.length - 1]).toBe(1_730_000_000);
    expect(ticks.length).toBeGreaterThanOrEqual(5);
    expect(ticks.length).toBeLessThanOrEqual(8);
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

describe("valueLabelIndices", () => {
  const pts: DataPoint[] = [
    { ts: 1, value: 100 },
    { ts: 2, value: 50 },
    { ts: 3, value: 200 },
    { ts: 4, value: 75 },
  ];

  it("labels every point when n ≤ 12", () => {
    expect(valueLabelIndices(pts)).toEqual([0, 1, 2, 3]);
  });

  it("labels first, last, min, max for larger n", () => {
    const many: DataPoint[] = Array.from({ length: 30 }, (_, i) => ({
      ts: i,
      value: i === 5 ? 1 : i === 25 ? 999 : 50,
    }));
    const labels = valueLabelIndices(many);
    expect(labels).toContain(0);
    expect(labels).toContain(29);
    expect(labels).toContain(5);
    expect(labels).toContain(25);
  });
});

describe("renderSvgChart markup", () => {
  it("includes x-axis ticks, markers, and axis baseline", () => {
    const points: DataPoint[] = Array.from({ length: 29 }, (_, i) => ({
      ts: Date.UTC(1995, 0, 1) / 1000 + i * 365 * 86_400,
      value: 184_600 + i * 4_000,
    }));
    const svg = renderSvgChart("city.plano.population", points, "line", "dark");
    expect(svg).toContain("<title>");
    expect(svg).toMatch(/1995/);
    expect(svg).toContain("<circle");
    expect(svg.match(/<circle/g)?.length).toBe(29);
    expect(svg).toContain('text-anchor="end"');
    expect(svg).toContain('text-anchor="start"');
  });
});