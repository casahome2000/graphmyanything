/** Stripe-shaped types for fixtures and API parsing (subset). */

export type RecurringInterval = "day" | "week" | "month" | "year";

export type StripePrice = {
  id: string;
  currency: string;
  unit_amount: number | null;
  recurring: {
    interval: RecurringInterval;
    interval_count: number;
    usage_type?: "licensed" | "metered";
  } | null;
  active?: boolean;
  product?: string;
  tax_behavior?: "inclusive" | "exclusive" | "unspecified";
};

export type StripeCoupon = {
  id: string;
  percent_off: number | null;
  amount_off: number | null;
  currency: string | null;
  duration: "forever" | "once" | "repeating";
  duration_in_months: number | null;
};

export type StripeDiscount = {
  id?: string;
  start: number;
  end: number | null;
  coupon: StripeCoupon;
};

export type SubscriptionItem = {
  id: string;
  quantity?: number | null;
  price: StripePrice;
  tax_rates?: { percentage: number }[];
};

export type PauseCollection = {
  behavior: string;
  resumes_at: number | null;
};

export type StripeSubscription = {
  id: string;
  customer: string;
  status:
    | "active"
    | "past_due"
    | "trialing"
    | "canceled"
    | "unpaid"
    | "incomplete"
    | "incomplete_expired"
    | "paused";
  created: number;
  start_date: number;
  ended_at: number | null;
  canceled_at: number | null;
  cancel_at: number | null;
  cancel_at_period_end: boolean;
  current_period_start: number;
  current_period_end: number;
  trial_start: number | null;
  trial_end: number | null;
  pause_collection: PauseCollection | null;
  items: { data: SubscriptionItem[] };
  discount?: StripeDiscount | null;
};

export type StripeInvoice = {
  id: string;
  currency: string;
  status: string | null;
  paid: boolean;
  paid_at: number | null;
  amount_paid: number;
  total: number;
  tax: number | null;
  subscription: string | null;
};

export type StripeRefund = {
  id: string;
  currency: string;
  amount: number;
  created: number;
  charge: string | null;
};

export type StripeCreditNote = {
  id: string;
  currency: string;
  amount: number;
  created: number;
  invoice: string;
  type: "pre_payment" | "post_payment";
  status: string;
};

export type DailyMetricPoint = {
  ts: number;
  value: number;
  tags?: Record<string, string>;
};

export type CurrencyMrrSnapshot = {
  currency: string;
  mrr: number;
  subscribers: number;
  mrrNew: number;
  mrrChurned: number;
  netRevenue: number;
};

export type BackfillDay = {
  ts: number;
  byCurrency: CurrencyMrrSnapshot[];
};