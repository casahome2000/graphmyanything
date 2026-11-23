import type { StripePrice, StripeSubscription } from "../src/types.js";

/** UTC-midnight anchor (2023-11-15T00:00:00Z). */
const BASE = Date.UTC(2023, 10, 15) / 1000;

export function day(n: number): number {
  return BASE + n * 86400;
}

export function monthlySub(
  overrides: Partial<StripeSubscription> & {
    unitAmount?: number;
    interval?: "month" | "year" | "week" | "day";
    intervalCount?: number;
    usageType?: "licensed" | "metered";
  },
): StripeSubscription {
  const unit = overrides.unitAmount ?? 5000;
  const interval = overrides.interval ?? "month";
  const intervalCount = overrides.intervalCount ?? 1;
  const price: StripePrice = {
    id: "price_test",
    currency: "usd",
    unit_amount: unit,
    recurring: {
      interval,
      interval_count: intervalCount,
      usage_type: overrides.usageType ?? "licensed",
    },
  };

  const created = overrides.created ?? day(0);
  return {
    id: overrides.id ?? "sub_test",
    customer: overrides.customer ?? "cus_test",
    status: overrides.status ?? "active",
    created,
    start_date: overrides.start_date ?? created,
    ended_at: overrides.ended_at ?? null,
    canceled_at: overrides.canceled_at ?? null,
    cancel_at: overrides.cancel_at ?? null,
    cancel_at_period_end: overrides.cancel_at_period_end ?? false,
    current_period_start: overrides.current_period_start ?? created,
    current_period_end: overrides.current_period_end ?? day(30),
    trial_start: overrides.trial_start ?? null,
    trial_end: overrides.trial_end ?? null,
    pause_collection: overrides.pause_collection ?? null,
    discount: overrides.discount ?? null,
    items: overrides.items ?? { data: [{ id: "si_1", quantity: 1, price }] },
  };
}