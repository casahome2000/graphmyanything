import type { RecurringInterval } from "../types.js";

/** Billing period length in fractional months (Stripe Billing Analytics style). */
export function monthsInBillingPeriod(
  interval: RecurringInterval,
  intervalCount: number,
): number {
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

/**
 * Month-normalized licensed amount in major currency units (cents → dollars).
 * Excludes tax passed separately; caller zeroes metered lines.
 */
export function monthNormalizedAmountCents(
  unitAmountCents: number,
  quantity: number,
  interval: RecurringInterval,
  intervalCount: number,
): number {
  const months = monthsInBillingPeriod(interval, intervalCount);
  if (months <= 0) return 0;
  return (unitAmountCents * quantity) / months;
}