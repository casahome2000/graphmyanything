import type { StripeCreditNote, StripeInvoice, StripeRefund } from "../types.js";
import { utcDayStart } from "./subscription-mrr.js";

/** Net cash per currency on a UTC day: paid invoices (paid_at) − refunds − credit notes. Amounts in major units. */
export function netRevenueByCurrencyOnDay(
  dayStart: number,
  invoices: StripeInvoice[],
  refunds: StripeRefund[],
  creditNotes: StripeCreditNote[],
): Map<string, number> {
  const out = new Map<string, number>();
  const add = (ccy: string, major: number) => {
    const k = ccy.toLowerCase();
    out.set(k, (out.get(k) ?? 0) + major);
  };

  for (const inv of invoices) {
    if (!inv.paid || inv.paid_at == null) continue;
    if (utcDayStart(inv.paid_at) !== dayStart) continue;
    const netCents = inv.amount_paid;
    add(inv.currency, netCents / 100);
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