// n8n Code node tail — requires stripe-mrr-sync-core functions in scope (inlined above).

const subsRaw = flattenStripeListPages($("Stripe subscriptions").all());
const invoicesRaw = flattenStripeListPages($("Stripe invoices (paid)").all());
const refundsRaw = flattenStripeListPages($("Stripe refunds").all());
const creditNotesRaw = flattenStripeListPages($("Stripe credit notes").all());

const subscriptions = subsRaw.map(mapStripeSubscription);
const invoices = invoicesRaw.map(mapStripeInvoice);
const refunds = refundsRaw.map(mapStripeRefund);
const creditNotes = creditNotesRaw.map(mapStripeCreditNote);

const { points, summary } = computeDailyBatchPoints(
  subscriptions,
  invoices,
  refunds,
  creditNotes,
);

return [
  {
    json: {
      points,
      ...summary,
    },
  },
];