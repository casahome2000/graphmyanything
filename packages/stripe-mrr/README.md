# graphmyanything-stripe

Month-normalized Stripe MRR and billing metrics aligned with Stripe Billing Analytics conventions.

## CLI

```bash
export STRIPE_RESTRICTED_KEY=rk_test_…   # never sk_…
npx graphmyanything-stripe backfill
npx graphmyanything-stripe sync
npx graphmyanything-stripe status
```

Writes metrics with the same upsert semantics as `graphmyanything-mcp` `track` into `GRAPHMYANYTHING_DB_PATH` (default `~/.graphmyanything/metrics.db`). State (no secrets) defaults to `~/.graphmyanything/stripe-connector.json`.

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