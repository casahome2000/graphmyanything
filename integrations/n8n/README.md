# n8n: Track Stripe MRR daily

Import [`track-stripe-mrr-daily.json`](./track-stripe-mrr-daily.json) in n8n (**Workflows → Import from File**).

Full setup: **[`docs/stripe-mrr.md`](../../docs/stripe-mrr.md)**.

## Design

| Piece | Implementation |
|--------|----------------|
| Stripe data | **HTTP Request** + Stripe API credential (`rk_…` only) with pagination |
| MRR math | **Code** node — inlined from [`stripe-mrr-sync-core.mjs`](./stripe-mrr-sync-core.mjs) |
| GraphMyAnything | **HTTP POST** `https://graphmyanything.com/api/v1/track/batch` + Header Auth Bearer |
| Local alternative | Sticky note: `npx graphmyanything-stripe sync` + MCP stdio |

The workflow deliberately avoids `require`, `child_process`, and `$credentials` in Code nodes so it runs on default self-hosted n8n.

After editing the core, repack the workflow:

```bash
node integrations/n8n/scripts/pack-workflow.mjs
```

Parity with the TypeScript engine: `npm test --prefix packages/stripe-mrr` (`n8n-inline-parity.test.ts`).

## Credentials

1. **Stripe restricted read key** — n8n **Stripe API** credential, or Header Auth on each Stripe HTTP node.
2. **GraphMyAnything API key** — **Header Auth** on **GMA track batch**: name `Authorization`, value `Bearer <key>` (from `graphmyanything-mcp sync` or your account page).
3. **MCP Client** (optional) — stdio `npx -y graphmyanything-mcp@latest` for local SQLite charts.

## Flow

Schedule → Stripe lists (sequential) → Compute MRR → GMA batch → optional MCP query.

## CLI import (optional)

```bash
jq -s . integrations/n8n/track-stripe-mrr-daily.json | npx n8n import:workflow --input=/dev/stdin
```

Credentials are not bundled; assign them after import.