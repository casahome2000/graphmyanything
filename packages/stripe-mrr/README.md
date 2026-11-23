# graphmyanything-stripe

Month-normalized Stripe MRR and billing metrics aligned with Stripe Billing Analytics conventions.

**Requires Node.js ≥22.13** (same as `graphmyanything-mcp`).

## Quick start

1. Create a **restricted read-only** API key in the Stripe Dashboard (`rk_test_…` or `rk_live_…`). Do **not** use a secret key (`sk_…`).
2. Grant **Read** on: subscriptions, customers, invoices, prices, products, coupons, promotion codes, credit notes, refunds/charges.
3. Point at the same SQLite DB as `graphmyanything-mcp` (default `~/.graphmyanything/metrics.db` via `GRAPHMYANYTHING_DB_PATH`).

```bash
export STRIPE_RESTRICTED_KEY=rk_test_…   # never sk_…
npx graphmyanything-stripe backfill
npx graphmyanything-stripe sync
npx graphmyanything-stripe status
```

Writes metrics with the same upsert semantics as MCP `track`. State (no secrets) defaults to `~/.graphmyanything/stripe-connector.json`.

### Hosted upload

After `npx -y graphmyanything-mcp@latest sync`, set **`GRAPHMYANYTHING_API_KEY`** or **`GMA_API_KEY`** so batch uploads can reach `https://graphmyanything.com/api/v1/track/batch`. The CLI still writes locally first; hosted mode mirrors your series for shareable charts. See [docs/stripe-mrr.md](https://github.com/casahome2000/graphmyanything/blob/master/docs/stripe-mrr.md) and [docs/hosted-api.md](https://github.com/casahome2000/graphmyanything/blob/master/docs/hosted-api.md).

## Metrics

| Metric | Description |
|--------|-------------|
| `stripe.mrr.<ccy>` | Licensed recurring revenue, month-normalized, per currency |
| `stripe.subscribers` | Active + past_due subscribers (excludes trial, paused) |
| `stripe.mrr.new.<ccy>` | Day-over-day MRR expansion |
| `stripe.mrr.churned.<ccy>` | Day-over-day MRR contraction |
| `stripe.revenue.net.<ccy>` | Cash: paid invoices (`paid_at`) − refunds − credit notes |

Currencies are **never** mixed through FX — chart each `stripe.mrr.<ccy>` separately.

## n8n

Import the daily workflow from the repo: [integrations/n8n/](https://github.com/casahome2000/graphmyanything/tree/master/integrations/n8n) (`track-stripe-mrr-daily.json`). Full setup: [docs/stripe-mrr.md](https://github.com/casahome2000/graphmyanything/blob/master/docs/stripe-mrr.md).

## Development

```bash
npm install
npm test
npm run build
```