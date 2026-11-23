/**
 * Pure JS Stripe MRR sync — shared by n8n Code node and parity tests.
 * Keep aligned with packages/stripe-mrr engine.
 */

const DAY = 86400;

export function utcDayStart(unixSec) {
  return Math.floor(unixSec / DAY) * DAY;
}

export function monthsInBillingPeriod(interval, intervalCount) {
  const n = Math.max(1, intervalCount);
  switch (interval) {
    case "day":
      return n / 30.437;
    case "week":
      return (n * 12) / 52;
    case "month":
      return n;
    case "year":
      return n * 12;
    default:
      return n;
  }
}

export function monthNormalizedAmountCents(
  unitAmountCents,
  quantity,
  interval,
  intervalCount,
) {
  const months = monthsInBillingPeriod(interval, intervalCount);
  if (months <= 0) return 0;
  return (unitAmountCents * quantity) / months;
}

function monthsBetween(fromSec, toSec) {
  const from = new Date(fromSec * 1000);
  const to = new Date(toSec * 1000);
  return (
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
    (to.getUTCMonth() - from.getUTCMonth())
  );
}

function discountMultiplier(discount, mrrCents, currency, ctx) {
  if (!discount?.coupon || mrrCents <= 0) return 1;
  const coupon = discount.coupon;
  const day = ctx.dayStart;
  if (discount.start > day) return 1;
  if (discount.end != null && day >= discount.end) return 1;

  if (coupon.duration === "once") {
    const periodStart = discount.start;
    const periodEnd = discount.end ?? periodStart + 30 * DAY;
    if (day < periodStart || day >= periodEnd) return 1;
  }

  if (coupon.duration === "repeating") {
    const months = coupon.duration_in_months ?? 0;
    if (months <= 0) return 1;
    const elapsed = monthsBetween(discount.start, day);
    if (elapsed >= months) return 1;
  }

  if (coupon.percent_off != null) {
    if (coupon.percent_off >= 100) return 0;
    return 1 - coupon.percent_off / 100;
  }

  if (coupon.amount_off != null && coupon.currency === currency) {
    const after = mrrCents - coupon.amount_off;
    return after <= 0 ? 0 : after / mrrCents;
  }
  return 1;
}

function applyCouponToMrrCents(mrrCents, discount, currency, ctx) {
  return mrrCents * discountMultiplier(discount, mrrCents, currency, ctx);
}

function licensedCurrency(sub) {
  for (const item of sub.items.data) {
    const price = item.price;
    if (price.recurring && price.recurring.usage_type !== "metered") {
      return price.currency;
    }
  }
  return sub.items.data[0]?.price.currency ?? null;
}

function isPausedOnDay(sub, dayStart) {
  const p = sub.pause_collection;
  if (!p) return false;
  if (sub.status === "paused") return true;
  if (p.resumes_at != null && dayStart < p.resumes_at) return true;
  return false;
}

function inTrialOnDay(sub, dayStart) {
  if (sub.trial_start == null || sub.trial_end == null) return false;
  return dayStart >= sub.trial_start && dayStart < sub.trial_end;
}

function subscriptionEndedBefore(sub, dayStart) {
  if (sub.ended_at != null && dayStart >= sub.ended_at) return true;
  if (
    sub.canceled_at != null &&
    dayStart >= sub.canceled_at &&
    !sub.cancel_at_period_end
  ) {
    return true;
  }
  return false;
}

function subscriptionStarted(sub, dayStart) {
  const start = sub.start_date ?? sub.created;
  return dayStart >= utcDayStart(start);
}

function effectiveStatusOnDay(sub, dayStart) {
  if (subscriptionEndedBefore(sub, dayStart)) return "canceled";
  if (isPausedOnDay(sub, dayStart)) return "paused";
  if (inTrialOnDay(sub, dayStart)) return "trialing";

  if (sub.cancel_at_period_end || sub.cancel_at != null) {
    const end =
      sub.cancel_at ??
      (sub.cancel_at_period_end ? sub.current_period_end : null);
    if (end != null && dayStart >= end) return "canceled";
    if (dayStart < end) {
      if (sub.status === "past_due") return "past_due";
      return "active";
    }
  }

  if (sub.status === "canceled" && sub.canceled_at != null && dayStart < sub.canceled_at) {
    return "active";
  }

  if (
    sub.status === "active" ||
    sub.status === "past_due" ||
    sub.status === "trialing"
  ) {
    return sub.status;
  }
  return sub.status;
}

function countsAsSubscriber(sub, dayStart) {
  if (!subscriptionStarted(sub, dayStart)) return false;
  if (subscriptionEndedBefore(sub, dayStart)) return false;
  if (isPausedOnDay(sub, dayStart)) return false;
  if (inTrialOnDay(sub, dayStart)) return false;
  const status = effectiveStatusOnDay(sub, dayStart);
  return status === "active" || status === "past_due";
}

function subscriptionMrrCentsOnDay(sub, dayStart) {
  if (inTrialOnDay(sub, dayStart)) {
    const currency = licensedCurrency(sub);
    return currency ? { currency, cents: 0 } : null;
  }
  if (!countsAsSubscriber(sub, dayStart)) return null;

  let totalCents = 0;
  const currency = licensedCurrency(sub);

  for (const item of sub.items.data) {
    const price = item.price;
    if (!price.recurring) continue;
    if (price.recurring.usage_type === "metered") continue;
    if (price.unit_amount == null) continue;
    const qty = item.quantity ?? 1;
    totalCents += monthNormalizedAmountCents(
      price.unit_amount,
      qty,
      price.recurring.interval,
      price.recurring.interval_count,
    );
  }

  if (!currency) return null;
  if (totalCents <= 0) return { currency, cents: 0 };

  const ctx = {
    dayStart,
    discountAnchor: sub.discount?.start ?? sub.start_date,
  };
  totalCents = applyCouponToMrrCents(
    totalCents,
    sub.discount,
    currency,
    ctx,
  );
  return { currency, cents: Math.max(0, totalCents) };
}

function netRevenueByCurrencyOnDay(
  dayStart,
  invoices,
  refunds,
  creditNotes,
) {
  const out = new Map();
  const add = (ccy, major) => {
    const k = ccy.toLowerCase();
    out.set(k, (out.get(k) ?? 0) + major);
  };
  for (const inv of invoices) {
    if (!inv.paid || inv.paid_at == null) continue;
    if (utcDayStart(inv.paid_at) !== dayStart) continue;
    add(inv.currency, inv.amount_paid / 100);
  }
  for (const rf of refunds) {
    if (utcDayStart(rf.created) !== dayStart) continue;
    add(rf.currency, -(rf.amount / 100));
  }
  for (const cn of creditNotes) {
    if (cn.status !== "issued") continue;
    if (utcDayStart(cn.created) !== dayStart) continue;
    add(cn.currency, -(cn.amount / 100));
  }
  return out;
}

export function buildDaySnapshot(
  dayStart,
  subscriptions,
  invoices = [],
  refunds = [],
  creditNotes = [],
) {
  const mrr = new Map();
  const mrrBySubscription = new Map();
  let subscribers = 0;

  for (const sub of subscriptions) {
    if (countsAsSubscriber(sub, dayStart)) subscribers += 1;
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

export function mrrDeltasBetweenDays(prev, next) {
  const currencies = new Set([
    ...prev.mrr.keys(),
    ...next.mrr.keys(),
    ...[...prev.mrrBySubscription.values()].map((v) =>
      v.currency.toLowerCase(),
    ),
    ...[...next.mrrBySubscription.values()].map((v) =>
      v.currency.toLowerCase(),
    ),
  ]);
  const deltas = [];
  for (const currency of currencies) {
    let newCents = 0;
    let churnedCents = 0;
    const prevSubs = new Map();
    const nextSubs = new Map();
    for (const [id, row] of prev.mrrBySubscription) {
      if (row.currency.toLowerCase() === currency) prevSubs.set(id, row.cents);
    }
    for (const [id, row] of next.mrrBySubscription) {
      if (row.currency.toLowerCase() === currency) nextSubs.set(id, row.cents);
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

const METRIC = {
  mrr: (ccy) => `stripe.mrr.${ccy.toLowerCase()}`,
  subscribers: () => "stripe.subscribers",
  mrrNew: (ccy) => `stripe.mrr.new.${ccy.toLowerCase()}`,
  mrrChurned: (ccy) => `stripe.mrr.churned.${ccy.toLowerCase()}`,
  revenueNet: (ccy) => `stripe.revenue.net.${ccy.toLowerCase()}`,
};

function snapshotToBatchPoints(snap, tags = { source: "stripe", via: "n8n" }) {
  const points = [];
  const push = (metric, value) => {
    if (value == null || Number.isNaN(value)) return;
    points.push({ metric, ts: snap.ts, value, tags });
  };
  push(METRIC.subscribers(), snap.subscribers);
  for (const [ccy, v] of snap.mrr) push(METRIC.mrr(ccy), v);
  for (const [ccy, v] of snap.newMrr) push(METRIC.mrrNew(ccy), v);
  for (const [ccy, v] of snap.churnedMrr) push(METRIC.mrrChurned(ccy), v);
  for (const [ccy, v] of snap.netRevenue) push(METRIC.revenueNet(ccy), v);
  return points;
}

export function mapStripeSubscription(raw) {
  const items = raw.items;
  let discount = null;
  if (raw.discount && typeof raw.discount === "object") {
    const c = raw.discount.coupon;
    discount = {
      start: Number(raw.discount.start),
      end: raw.discount.end == null ? null : Number(raw.discount.end),
      coupon: {
        id: String(c.id),
        percent_off: c.percent_off ?? null,
        amount_off: c.amount_off ?? null,
        currency: c.currency ?? null,
        duration: c.duration,
        duration_in_months: c.duration_in_months ?? null,
      },
    };
  }
  return {
    id: String(raw.id),
    customer: String(raw.customer),
    status: raw.status,
    created: Number(raw.created),
    start_date: Number(raw.start_date ?? raw.created),
    ended_at: raw.ended_at == null ? null : Number(raw.ended_at),
    canceled_at: raw.canceled_at == null ? null : Number(raw.canceled_at),
    cancel_at: raw.cancel_at == null ? null : Number(raw.cancel_at),
    cancel_at_period_end: Boolean(raw.cancel_at_period_end),
    current_period_start: Number(raw.current_period_start),
    current_period_end: Number(raw.current_period_end),
    trial_start: raw.trial_start == null ? null : Number(raw.trial_start),
    trial_end: raw.trial_end == null ? null : Number(raw.trial_end),
    pause_collection: raw.pause_collection ?? null,
    discount,
    items: {
      data: (items?.data ?? []).map((item) => ({
        id: String(item.id),
        quantity: item.quantity ?? null,
        price: mapStripePrice(item.price),
      })),
    },
  };
}

function mapStripePrice(raw) {
  const recurring = raw.recurring;
  return {
    id: String(raw.id),
    currency: String(raw.currency),
    unit_amount: raw.unit_amount ?? null,
    recurring: recurring
      ? {
          interval: recurring.interval,
          interval_count: Number(recurring.interval_count ?? 1),
          usage_type: recurring.usage_type ?? "licensed",
        }
      : null,
  };
}

export function mapStripeInvoice(raw) {
  const paidAt =
    raw.status_transitions?.paid_at != null
      ? Number(raw.status_transitions.paid_at)
      : raw.paid_at != null
        ? Number(raw.paid_at)
        : null;
  return {
    id: String(raw.id),
    currency: String(raw.currency),
    status: raw.status ?? null,
    paid: Boolean(raw.paid),
    paid_at: paidAt,
    amount_paid: Number(raw.amount_paid ?? 0),
    total: Number(raw.total ?? 0),
    tax: raw.tax ?? null,
    subscription: raw.subscription == null ? null : String(raw.subscription),
  };
}

export function mapStripeRefund(raw) {
  return {
    id: String(raw.id),
    currency: String(raw.currency),
    amount: Number(raw.amount),
    created: Number(raw.created),
    charge: raw.charge == null ? null : String(raw.charge),
  };
}

export function mapStripeCreditNote(raw) {
  return {
    id: String(raw.id),
    currency: String(raw.currency),
    amount: Number(raw.amount ?? raw.total ?? 0),
    created: Number(raw.created),
    invoice: String(raw.invoice),
    type: raw.type,
    status: String(raw.status),
  };
}

/** Flatten paginated Stripe list responses from n8n HTTP nodes. */
export function flattenStripeListPages(pages) {
  const out = [];
  for (const page of pages) {
    const body = page?.json ?? page;
    if (Array.isArray(body?.data)) out.push(...body.data);
  }
  return out;
}

/**
 * Daily sync: today + yesterday deltas — mirrors graphmyanything-stripe sync.
 */
export function computeDailyBatchPoints(
  subscriptions,
  invoices,
  refunds,
  creditNotes,
  nowUnixSec = Math.floor(Date.now() / 1000),
) {
  const today = utcDayStart(nowUnixSec);
  const yesterday = today - DAY;
  const todaySnap = buildDaySnapshot(
    today,
    subscriptions,
    invoices,
    refunds,
    creditNotes,
  );
  const ySnap = buildDaySnapshot(
    yesterday,
    subscriptions,
    invoices,
    refunds,
    creditNotes,
  );
  const newMrr = new Map();
  const churnedMrr = new Map();
  for (const d of mrrDeltasBetweenDays(ySnap, todaySnap)) {
    if (d.newMrr > 0) newMrr.set(d.currency, d.newMrr);
    if (d.churnedMrr > 0) churnedMrr.set(d.currency, d.churnedMrr);
  }
  const rollup = {
    ts: today,
    mrr: todaySnap.mrr,
    subscribers: todaySnap.subscribers,
    newMrr,
    churnedMrr,
    netRevenue: todaySnap.netRevenue,
  };
  const points = snapshotToBatchPoints(rollup);
  return {
    points,
    summary: {
      utcDay: today,
      subscribers: todaySnap.subscribers,
      mrrUsd: todaySnap.mrr.get("usd") ?? null,
    },
  };
}