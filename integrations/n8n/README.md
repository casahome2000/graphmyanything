# n8n: Track Stripe MRR daily

Import [`track-stripe-mrr-daily.json`](./track-stripe-mrr-daily.json) in n8n (**Workflows → Import from File**).

Full setup for the Stripe connector (restricted keys, metric names, backfill): **[`docs/stripe-mrr.md`](../../docs/stripe-mrr.md)**.

## Which integration path?

| Path | When to use |
|------|-------------|
| **`graphmyanything-stripe sync` + MCP** (this workflow) | **Self-hosted n8n** with Node 22+, MCP stdio, and a Stripe **restricted** key (`rk_…`). |
| **HTTP Request** (`POST https://api.graphmyanything.com/v1/track`) | **Later.** Disabled placeholder until the cloud track API ships. |

## Stripe credential

1. **Credentials → New → Stripe API**.
2. Name: `Stripe restricted read key`.
3. Secret: your **`rk_test_…`** or **`rk_live_…`** key (read-only). **Do not** use `sk_…`.
4. Attach to **Stripe sync (CLI)**.

## MCP credential setup

1. **Credentials → New → MCP Client** (name: `graphmyanything-mcp (stdio)`).
2. Transport: **stdio**.
3. Command: `npx`
4. Arguments: `-y`, `graphmyanything-mcp@latest`
5. Ensure **Node 22.13+** on the n8n worker.

Attach MCP credential to **MCP query 90d**, **MCP insight**, and **MCP chart SVG**.

Install the Stripe CLI package on the worker (`graphmyanything-stripe` from this monorepo or `npx` once published).

## Flow

1. Schedule (daily 9:00).
2. **Stripe sync (CLI)** → writes metrics to SQLite (same path as MCP).
3. `query` → `insight` → `chart` on `stripe.mrr.usd` (90d).

Chart files land on the n8n host under `~/.graphmyanything/charts/` (or beside `GRAPHMYANYTHING_DB_PATH`).

## CLI import (optional)

```bash
jq -s . integrations/n8n/track-stripe-mrr-daily.json | n8n import:workflow --input=/dev/stdin
```