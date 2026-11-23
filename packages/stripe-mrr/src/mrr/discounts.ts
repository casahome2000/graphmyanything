import type { StripeCoupon, StripeDiscount } from "../types.js";

export type DiscountContext = {
  /** Unix seconds — start of UTC day for snapshot */
  dayStart: number;
  /** When the subscription (or discount) started — for repeating months */
  discountAnchor: number;
};

function monthsBetween(fromSec: number, toSec: number): number {
  const from = new Date(fromSec * 1000);
  const to = new Date(toSec * 1000);
  return (
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
    (to.getUTCMonth() - from.getUTCMonth())
  );
}

/** Returns multiplier in [0, 1] applied to pre-discount MRR cents. */
export function discountMultiplier(
  discount: StripeDiscount | null | undefined,
  mrrCents: number,
  currency: string,
  ctx: DiscountContext,
): number {
  if (!discount?.coupon || mrrCents <= 0) return 1;

  const coupon = discount.coupon;
  const day = ctx.dayStart;

  if (discount.start > day) return 1;
  if (discount.end != null && day >= discount.end) return 1;

  const { duration, duration_in_months } = coupon;

  if (duration === "once") {
    const periodStart = discount.start;
    const periodEnd = discount.end ?? periodStart + 30 * 86400;
    if (day < periodStart || day >= periodEnd) return 1;
  }

  if (duration === "repeating") {
    const months = duration_in_months ?? 0;
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

export function applyCouponToMrrCents(
  mrrCents: number,
  discount: StripeDiscount | null | undefined,
  currency: string,
  ctx: DiscountContext,
): number {
  const mult = discountMultiplier(discount, mrrCents, currency, ctx);
  return mrrCents * mult;
}