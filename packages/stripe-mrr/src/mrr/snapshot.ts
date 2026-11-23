import type {
  StripeCreditNote,
  StripeInvoice,
  StripeRefund,
  StripeSubscription,
} from "../types.js";
import { netRevenueByCurrencyOnDay } from "./net-revenue.js";
import {
  countsAsSubscriber,
  subscriptionMrrCentsOnDay,
  utcDayStart,
} from "./subscription-mrr.js";

export type DaySnapshot = {
  ts: number;
  mrr: Map<string, number>;
  subscribers: number;
  mrrBySubscription: Map<string, { currency: string; cents: number }>;
  netRevenue: Map<string, number>;
};

export function buildDaySnapshot(
  dayStart: number,
  subscriptions: StripeSubscription[],
  invoices: StripeInvoice[] = [],
  refunds: StripeRefund[] = [],
  creditNotes: StripeCreditNote[] = [],
): DaySnapshot {
  const mrr = new Map<string, number>();
  const mrrBySubscription = new Map<
    string,
    { currency: string; cents: number }
  >();
  let subscribers = 0;

  for (const sub of subscriptions) {
    if (countsAsSubscriber(sub, dayStart)) {
      subscribers += 1;
    }
    const row = subscriptionMrrCentsOnDay(sub, dayStart);
    if (!row) continue;
    mrrBySubscription.set(sub.id, row);
    const k = row.currency.toLowerCase();
    mrr.set(k, (mrr.get(k) ?? 0) + row.cents / 100);
  }

  const netRevenue = netRevenueByCurrencyOnDay(
    dayStart,
    invoices,
    refunds,
    creditNotes,
  );

  return {
    ts: dayStart,
    mrr,
    subscribers,
    mrrBySubscription,
    netRevenue,
  };
}

export type MrrDelta = {
  currency: string;
  newMrr: number;
  churnedMrr: number;
};

export function mrrDeltasBetweenDays(
  prev: DaySnapshot,
  next: DaySnapshot,
): MrrDelta[] {
  const currencies = new Set<string>([
    ...prev.mrr.keys(),
    ...next.mrr.keys(),
    ...[...prev.mrrBySubscription.values()].map((v) =>
      v.currency.toLowerCase(),
    ),
    ...[...next.mrrBySubscription.values()].map((v) =>
      v.currency.toLowerCase(),
    ),
  ]);

  const deltas: MrrDelta[] = [];

  for (const currency of currencies) {
    let newCents = 0;
    let churnedCents = 0;

    const prevSubs = new Map<string, number>();
    const nextSubs = new Map<string, number>();

    for (const [id, row] of prev.mrrBySubscription) {
      if (row.currency.toLowerCase() === currency) {
        prevSubs.set(id, row.cents);
      }
    }
    for (const [id, row] of next.mrrBySubscription) {
      if (row.currency.toLowerCase() === currency) {
        nextSubs.set(id, row.cents);
      }
    }

    const allIds = new Set([...prevSubs.keys(), ...nextSubs.keys()]);
    for (const id of allIds) {
      const was = prevSubs.get(id) ?? 0;
      const now = nextSubs.get(id) ?? 0;
      const diff = now - was;
      if (diff > 0) newCents += diff;
      if (diff < 0) churnedCents += -diff;
    }

    deltas.push({
      currency,
      newMrr: newCents / 100,
      churnedMrr: churnedCents / 100,
    });
  }

  return deltas;
}

export function enumerateUtcDays(fromTs: number, toTs: number): number[] {
  const start = utcDayStart(fromTs);
  const end = utcDayStart(toTs);
  const days: number[] = [];
  for (let t = start; t <= end; t += 86400) {
    days.push(t);
  }
  return days;
}