import { describe, expect, it } from "vitest";
import { computeDailyBatchPoints } from "../../../integrations/n8n/stripe-mrr-sync-core.mjs";
import { buildDaySnapshot, mrrDeltasBetweenDays } from "../src/mrr/snapshot.js";
import { utcDayStart } from "../src/mrr/subscription-mrr.js";
import { snapshotToMetricSeries } from "../src/metrics.js";
import { day, monthlySub } from "./helpers.js";

const TAGS = { source: "stripe", via: "n8n" };

function engineDailyPoints(
  subscriptions: ReturnType<typeof monthlySub>[],
  now: number,
) {
  const today = utcDayStart(now);
  const yesterday = today - 86400;
  const todaySnap = buildDaySnapshot(today, subscriptions);
  const ySnap = buildDaySnapshot(yesterday, subscriptions);
  const newMrr = new Map<string, number>();
  const churnedMrr = new Map<string, number>();
  for (const d of mrrDeltasBetweenDays(ySnap, todaySnap)) {
    if (d.newMrr > 0) newMrr.set(d.currency, d.newMrr);
    if (d.churnedMrr > 0) churnedMrr.set(d.currency, d.churnedMrr);
  }
  const series = snapshotToMetricSeries([
    {
      ts: today,
      mrr: todaySnap.mrr,
      subscribers: todaySnap.subscribers,
      newMrr,
      churnedMrr,
      netRevenue: todaySnap.netRevenue,
    },
  ], { source: "stripe" });

  return series
    .flatMap((s) =>
      s.points.map((p) => ({
        metric: s.metric,
        ts: p.ts,
        value: p.value,
        tags: { ...TAGS, ...p.tags },
      })),
    )
    .map((p) => ({
      ...p,
      tags: { source: "stripe", via: p.tags?.via ?? "engine" },
    }));
}

function normalize(points: { metric: string; ts: number; value: number }[]) {
  return [...points]
    .map((p) => ({ metric: p.metric, ts: p.ts, value: p.value }))
    .sort((a, b) =>
      a.metric.localeCompare(b.metric) || a.ts - b.ts || a.value - b.value,
    );
}

describe("n8n inline core vs engine", () => {
  it("matches engine sync output on subscription-mrr fixtures", () => {
    const subs = [
      monthlySub({ id: "sub_a", created: day(0), unitAmount: 10_000 }),
      monthlySub({ id: "sub_b", created: day(2), unitAmount: 5_000 }),
      monthlySub({
        id: "sub_c",
        created: day(0),
        unitAmount: 2_000,
        ended_at: day(4),
        status: "canceled",
        canceled_at: day(4),
      }),
    ];
    const now = day(5) + 3600;
    const n8n = computeDailyBatchPoints(subs, [], [], [], now);
    const engine = engineDailyPoints(subs, now);
    expect(normalize(n8n.points)).toEqual(normalize(engine));
    expect(n8n.summary.subscribers).toBeGreaterThan(0);
  });

  it("matches engine on discount and trial edge cases", () => {
    const subs = [
      monthlySub({
        status: "trialing",
        trial_start: day(0),
        trial_end: day(14),
      }),
      monthlySub({
        discount: {
          start: day(0),
          end: null,
          coupon: {
            id: "coup",
            percent_off: 20,
            amount_off: null,
            currency: null,
            duration: "forever",
            duration_in_months: null,
          },
        },
      }),
    ];
    const now = day(1) + 100;
    const n8n = computeDailyBatchPoints(subs, [], [], [], now);
    const engine = engineDailyPoints(subs, now);
    expect(normalize(n8n.points)).toEqual(normalize(engine));
  });
});