import { applyCouponToMrrCents, type DiscountContext } from "./discounts.js";
import { monthNormalizedAmountCents } from "./normalize.js";
import type { StripeSubscription } from "../types.js";

const DAY = 86400;

function licensedCurrency(sub: StripeSubscription): string | null {
  for (const item of sub.items.data) {
    const price = item.price;
    if (price.recurring && price.recurring.usage_type !== "metered") {
      return price.currency;
    }
  }
  return sub.items.data[0]?.price.currency ?? null;
}

export function utcDayStart(unixSec: number): number {
  return Math.floor(unixSec / DAY) * DAY;
}

function isPausedOnDay(
  sub: StripeSubscription,
  dayStart: number,
): boolean {
  const p = sub.pause_collection;
  if (!p) return false;
  if (sub.status === "paused") return true;
  if (p.resumes_at != null && dayStart < p.resumes_at) return true;
  return false;
}

function inTrialOnDay(sub: StripeSubscription, dayStart: number): boolean {
  if (sub.trial_start == null || sub.trial_end == null) return false;
  return dayStart >= sub.trial_start && dayStart < sub.trial_end;
}

function subscriptionEndedBefore(sub: StripeSubscription, dayStart: number): boolean {
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

function subscriptionStarted(sub: StripeSubscription, dayStart: number): boolean {
  const start = sub.start_date ?? sub.created;
  return dayStart >= utcDayStart(start);
}

/** Whether subscription contributes to subscriber count on this UTC day. */
export function countsAsSubscriber(
  sub: StripeSubscription,
  dayStart: number,
): boolean {
  if (!subscriptionStarted(sub, dayStart)) return false;
  if (subscriptionEndedBefore(sub, dayStart)) return false;
  if (isPausedOnDay(sub, dayStart)) return false;
  if (inTrialOnDay(sub, dayStart)) return false;

  const status = effectiveStatusOnDay(sub, dayStart);
  return status === "active" || status === "past_due";
}

function effectiveStatusOnDay(
  sub: StripeSubscription,
  dayStart: number,
): StripeSubscription["status"] {
  if (subscriptionEndedBefore(sub, dayStart)) return "canceled";
  if (isPausedOnDay(sub, dayStart)) return "paused";
  if (inTrialOnDay(sub, dayStart)) return "trialing";

  if (sub.cancel_at_period_end || sub.cancel_at != null) {
    const end =
      sub.cancel_at ??
      (sub.cancel_at_period_end ? sub.current_period_end : null);
    if (end != null && dayStart >= end) return "canceled";
    if (dayStart < end!) {
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

export function subscriptionMrrCentsOnDay(
  sub: StripeSubscription,
  dayStart: number,
): { currency: string; cents: number } | null {
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
    const lineMrr = monthNormalizedAmountCents(
      price.unit_amount,
      qty,
      price.recurring.interval,
      price.recurring.interval_count,
    );
    totalCents += lineMrr;
  }

  if (!currency) return null;
  if (totalCents <= 0) {
    return { currency, cents: 0 };
  }

  const ctx: DiscountContext = {
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

/** MRR in major units (e.g. dollars) for reporting. */
export function subscriptionMrrOnDay(
  sub: StripeSubscription,
  dayStart: number,
): { currency: string; mrr: number } | null {
  const row = subscriptionMrrCentsOnDay(sub, dayStart);
  if (!row) return null;
  return { currency: row.currency, mrr: row.cents / 100 };
}