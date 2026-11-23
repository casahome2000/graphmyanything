import {
  buildDaySnapshot,
  enumerateUtcDays,
  mrrDeltasBetweenDays,
  type DaySnapshot,
} from "../mrr/snapshot.js";
import { utcDayStart } from "../mrr/subscription-mrr.js";
import { snapshotToMetricSeries, type MetricSeries } from "../metrics.js";
import type {
  StripeCreditNote,
  StripeInvoice,
  StripeRefund,
  StripeSubscription,
} from "../types.js";

export type BackfillInput = {
  subscriptions: StripeSubscription[];
  invoices?: StripeInvoice[];
  refunds?: StripeRefund[];
  creditNotes?: StripeCreditNote[];
  /** Inclusive UTC day range; defaults from earliest sub.created → today UTC. */
  fromTs?: number;
  toTs?: number;
};

export type BackfillResult = {
  days: DaySnapshot[];
  series: MetricSeries[];
};

export function backfillDailyHistory(input: BackfillInput): BackfillResult {
  const subs = input.subscriptions;
  const invoices = input.invoices ?? [];
  const refunds = input.refunds ?? [];
  const creditNotes = input.creditNotes ?? [];

  const earliest =
    subs.length > 0
      ? Math.min(...subs.map((s) => utcDayStart(s.created)))
      : utcDayStart(Math.floor(Date.now() / 1000));

  const fromTs = input.fromTs ?? earliest;
  const toTs = input.toTs ?? utcDayStart(Math.floor(Date.now() / 1000));

  const dayStarts = enumerateUtcDays(fromTs, toTs);
  const days: DaySnapshot[] = [];

  for (const ts of dayStarts) {
    days.push(
      buildDaySnapshot(ts, subs, invoices, refunds, creditNotes),
    );
  }

  const rollup = days.map((snap, i) => {
    const newMrr = new Map<string, number>();
    const churnedMrr = new Map<string, number>();

    if (i > 0) {
      const deltas = mrrDeltasBetweenDays(days[i - 1]!, snap);
      for (const d of deltas) {
        if (d.newMrr > 0) newMrr.set(d.currency, d.newMrr);
        if (d.churnedMrr > 0) churnedMrr.set(d.currency, d.churnedMrr);
      }
    }

    return {
      ts: snap.ts,
      mrr: snap.mrr,
      subscribers: snap.subscribers,
      newMrr,
      churnedMrr,
      netRevenue: snap.netRevenue,
    };
  });

  return {
    days,
    series: snapshotToMetricSeries(rollup),
  };
}