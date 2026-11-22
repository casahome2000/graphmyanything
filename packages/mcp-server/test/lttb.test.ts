import { describe, expect, it } from "vitest";
import { lttb } from "../src/lib/lttb.js";

describe("lttb", () => {
  it("returns all points when under threshold", () => {
    const pts = Array.from({ length: 10 }, (_, i) => ({ ts: i, value: i }));
    expect(lttb(pts, 50)).toHaveLength(10);
  });

  it("preserves endpoints when downsampling", () => {
    const pts = Array.from({ length: 200 }, (_, i) => ({
      ts: i,
      value: Math.sin(i / 10) * 100,
    }));
    const out = lttb(pts, 20);
    expect(out[0]).toEqual(pts[0]);
    expect(out[out.length - 1]).toEqual(pts[pts.length - 1]);
    expect(out.length).toBeLessThanOrEqual(20);
  });

  it("keeps a spike visible", () => {
    const pts = Array.from({ length: 100 }, (_, i) => ({
      ts: i,
      value: i === 50 ? 1000 : 1,
    }));
    const out = lttb(pts, 15);
    const hasSpike = out.some((p) => p.value > 500);
    expect(hasSpike).toBe(true);
  });
});