/** Metric names written to GraphMyAnything (one series per currency). */

export const METRIC = {
  mrr: (currency: string) => `stripe.mrr.${currency.toLowerCase()}`,
  subscribers: () => "stripe.subscribers",
  mrrNew: (currency: string) => `stripe.mrr.new.${currency.toLowerCase()}`,
  mrrChurned: (currency: string) =>
    `stripe.mrr.churned.${currency.toLowerCase()}`,
  revenueNet: (currency: string) =>
    `stripe.revenue.net.${currency.toLowerCase()}`,
} as const;

export type MetricSeries = {
  metric: string;
  points: { ts: number; value: number; tags?: Record<string, string> }[];
};

export function snapshotToMetricSeries(
  snapshots: {
    ts: number;
    mrr: Map<string, number>;
    subscribers: number;
    newMrr: Map<string, number>;
    churnedMrr: Map<string, number>;
    netRevenue: Map<string, number>;
  }[],
  tags: Record<string, string> = { source: "stripe" },
): MetricSeries[] {
  const byMetric = new Map<string, { ts: number; value: number }[]>();

  const push = (metric: string, ts: number, value: number) => {
    const list = byMetric.get(metric) ?? [];
    list.push({ ts, value });
    byMetric.set(metric, list);
  };

  for (const snap of snapshots) {
    push(METRIC.subscribers(), snap.ts, snap.subscribers);
    for (const [ccy, v] of snap.mrr) {
      push(METRIC.mrr(ccy), snap.ts, v);
    }
    for (const [ccy, v] of snap.newMrr) {
      push(METRIC.mrrNew(ccy), snap.ts, v);
    }
    for (const [ccy, v] of snap.churnedMrr) {
      push(METRIC.mrrChurned(ccy), snap.ts, v);
    }
    for (const [ccy, v] of snap.netRevenue) {
      push(METRIC.revenueNet(ccy), snap.ts, v);
    }
  }

  return [...byMetric.entries()].map(([metric, points]) => ({
    metric,
    points: points.map((p) => ({ ...p, tags })),
  }));
}