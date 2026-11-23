# graphmyanything-stripe (engine)

Month-normalized Stripe MRR and billing metrics aligned with Stripe Billing Analytics conventions. Used by the `graphmyanything-stripe` CLI (separate PR) and n8n integrations.

## Metrics

| Metric | Description |
|--------|-------------|
| `stripe.mrr.<ccy>` | Licensed recurring revenue, month-normalized, per currency |
| `stripe.subscribers` | Active + past_due subscribers (excludes trial, paused) |
| `stripe.mrr.new.<ccy>` | Day-over-day MRR expansion |
| `stripe.mrr.churned.<ccy>` | Day-over-day MRR contraction |
| `stripe.revenue.net.<ccy>` | Cash: paid invoices (`paid_at`) − refunds − credit notes |

## Development

```bash
npm install
npm test
npm run build
```