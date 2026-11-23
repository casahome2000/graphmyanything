import type {
  StripeCreditNote,
  StripeInvoice,
  StripeRefund,
  StripeSubscription,
} from "../../types.js";

export function mapSubscription(raw: Record<string, unknown>): StripeSubscription {
  const items = raw.items as { data: Record<string, unknown>[] };
  return {
    id: String(raw.id),
    customer: String(raw.customer),
    status: raw.status as StripeSubscription["status"],
    created: Number(raw.created),
    start_date: Number(raw.start_date ?? raw.created),
    ended_at: (raw.ended_at as number | null) ?? null,
    canceled_at: (raw.canceled_at as number | null) ?? null,
    cancel_at: (raw.cancel_at as number | null) ?? null,
    cancel_at_period_end: Boolean(raw.cancel_at_period_end),
    current_period_start: Number(raw.current_period_start),
    current_period_end: Number(raw.current_period_end),
    trial_start: (raw.trial_start as number | null) ?? null,
    trial_end: (raw.trial_end as number | null) ?? null,
    pause_collection: (raw.pause_collection as StripeSubscription["pause_collection"]) ?? null,
    discount: raw.discount
      ? {
          start: Number((raw.discount as Record<string, unknown>).start),
          end:
            ((raw.discount as Record<string, unknown>).end as number | null) ??
            null,
          coupon: mapCoupon(
            (raw.discount as Record<string, unknown>).coupon as Record<
              string,
              unknown
            >,
          ),
        }
      : null,
    items: {
      data: (items?.data ?? []).map((item) => ({
        id: String(item.id),
        quantity: (item.quantity as number | null) ?? null,
        price: mapPrice(item.price as Record<string, unknown>),
      })),
    },
  };
}

function mapCoupon(raw: Record<string, unknown>) {
  return {
    id: String(raw.id),
    percent_off: (raw.percent_off as number | null) ?? null,
    amount_off: (raw.amount_off as number | null) ?? null,
    currency: (raw.currency as string | null) ?? null,
    duration: raw.duration as "forever" | "once" | "repeating",
    duration_in_months: (raw.duration_in_months as number | null) ?? null,
  };
}

function mapPrice(raw: Record<string, unknown>) {
  const recurring = raw.recurring as Record<string, unknown> | null;
  return {
    id: String(raw.id),
    currency: String(raw.currency),
    unit_amount: (raw.unit_amount as number | null) ?? null,
    recurring: recurring
      ? {
          interval: recurring.interval as "day" | "week" | "month" | "year",
          interval_count: Number(recurring.interval_count ?? 1),
          usage_type: (recurring.usage_type as "licensed" | "metered") ?? "licensed",
        }
      : null,
  };
}

export function mapInvoice(raw: Record<string, unknown>): StripeInvoice {
  return {
    id: String(raw.id),
    currency: String(raw.currency),
    status: (raw.status as string | null) ?? null,
    paid: Boolean(raw.paid),
    paid_at: (raw.status_transitions as { paid_at?: number } | undefined)
      ?.paid_at
      ? Number(
          (raw.status_transitions as { paid_at: number }).paid_at,
        )
      : ((raw.paid_at as number | null) ?? null),
    amount_paid: Number(raw.amount_paid ?? 0),
    total: Number(raw.total ?? 0),
    tax: (raw.tax as number | null) ?? null,
    subscription:
      raw.subscription == null ? null : String(raw.subscription),
  };
}

export function mapRefund(raw: Record<string, unknown>): StripeRefund {
  return {
    id: String(raw.id),
    currency: String(raw.currency),
    amount: Number(raw.amount),
    created: Number(raw.created),
    charge: raw.charge == null ? null : String(raw.charge),
  };
}

export function mapCreditNote(raw: Record<string, unknown>): StripeCreditNote {
  return {
    id: String(raw.id),
    currency: String(raw.currency),
    amount: Number(raw.amount ?? raw.total ?? 0),
    created: Number(raw.created),
    invoice: String(raw.invoice),
    type: raw.type as "pre_payment" | "post_payment",
    status: String(raw.status),
  };
}