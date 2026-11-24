# n8n: Track Stripe MRR daily

Import [`track-stripe-mrr-daily.json`](./track-stripe-mrr-daily.json) in n8n (**Workflows → Import from File**).

Full setup: **[`docs/stripe-mrr.md`](../../docs/stripe-mrr.md)**.

## Design

| Piece | Implementation |
|--------|----------------|
| Stripe data | **HTTP Request** + Stripe API credential (`rk_…` only) with pagination, pinned to `Stripe-Version: 2024-11-20.acacia`; each list node runs once (**Execute Once**) |
| MRR math | **Code** node — inlined from [`stripe-mrr-sync-core.mjs`](./stripe-mrr-sync-core.mjs) |
| GraphMyAnything | **HTTP POST** `https://graphmyanything.com/api/v1/track/batch` + Header Auth Bearer |
| Local alternative | Sticky note: `npx graphmyanything-stripe sync` (your agent reads the same DB through `graphmyanything-mcp`) |

The workflow deliberately avoids `require`, `child_process`, and `$credentials` in Code nodes so it runs on default self-hosted n8n.

After editing the core, repack the workflow:

```bash
node integrations/n8n/scripts/pack-workflow.mjs
```

Parity with the TypeScript engine: `npm test --prefix packages/stripe-mrr` (`n8n-inline-parity.test.ts`).

## Credentials

1. **Stripe restricted read key** — n8n **Stripe API** credential, or Header Auth on each Stripe HTTP node.
2. **GraphMyAnything API key** — **Header Auth** on **GMA track batch**: name `Authorization`, value `Bearer <key>` (from `graphmyanything-mcp sync` or your account page).

## Flow

Schedule (or **Run now (test)**) → Stripe lists (sequential, each once) → Compute MRR → GMA batch.

Tested end to end on n8n 2.48.7 against a mock Stripe API: points land in the hosted account and match `graphmyanything-stripe sync` on the same data.

## CLI import (optional)

```bash
jq -s . integrations/n8n/track-stripe-mrr-daily.json | npx n8n import:workflow --input=/dev/stdin
```

Credentials are not bundled; assign them after import.

**GraphMyAnything hosted accounts:** [graphmyanything.com](https://graphmyanything.com) — **Free:** <!-- fact:plans.free.metrics -->3<!-- /fact --> metrics, <!-- fact:plans.free.points fmt:compactK -->10k<!-- /fact --> points, <!-- fact:plans.free.readDays -->90<!-- /fact -->-day reads, <!-- fact:plans.free.shareLinks -->3<!-- /fact --> share links; **Founding:** $<!-- fact:plans.founding.priceUsd -->49<!-- /fact --> for the first <!-- fact:plans.founding.termMonths -->12<!-- /fact --> months, then $<!-- fact:plans.founding.thenMonthlyUsd -->9<!-- /fact -->/mo (auto-renews; cancel anytime).