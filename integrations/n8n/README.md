# n8n: Track Stripe MRR daily

Import [`track-stripe-mrr-daily.json`](./track-stripe-mrr-daily.json) in n8n (**Workflows → Import from File**).

## Which integration path?

| Path | When to use |
|------|-------------|
| **MCP Client Tool** (nodes in this workflow) | **Today.** n8n 1.76+ ships MCP Client credentials with **stdio** transport — same as Cursor/Claude Desktop. |
| **HTTP Request** (`POST https://api.graphmyanything.com/v1/track`) | **Later.** Documented cloud placeholder; node is set to `neverError` until the API exists. |

We chose **MCP Client** as the primary path because n8n supports stdio MCP servers natively (no throwaway shell scripts). The HTTP node documents the future one-line cloud track endpoint for teams that do not run MCP on the n8n host.

## MCP credential setup

1. **Credentials → New → MCP Client** (name: `graphmyanything-mcp (stdio)`).
2. Transport: **stdio**.
3. Command: `npx`
4. Arguments: `-y`, `graphmyanything-mcp@0.1.2`
5. Ensure **Node 22.13+** on the n8n worker (built-in `node:sqlite`).

On the imported workflow:

- Disable **HTTP track (cloud placeholder)**.
- Attach your credential to **MCP track**, **MCP query 90d**, **MCP insight**, and **MCP chart SVG**.
- Replace **Mock Stripe MRR** with a Stripe node or your billing HTTP source when ready.

## Creator template notes

The imported workflow includes an **overview sticky** (How it works, Set up steps, Requirements, Customize) plus **section stickies** for the schedule, data source, track path, query, insight, and chart nodes. Use them when publishing to the n8n template library.

## Flow

1. Schedule (daily 9:00).
2. Read MRR (mock code node in template).
3. `track` → `query` (90d, token_budget 300) → `insight` → `chart` (area, dark).

Pin **`graphmyanything-mcp@0.1.2`** and **Node 22.13+** on any worker that runs MCP stdio.

Chart files land on the n8n host under `~/.graphmyanything/charts/` (or `charts/` beside `GRAPHMYANYTHING_DB_PATH`). The `chart` tool returns a local `path` only (`url` is null until hosted charts ship).

## CLI import (optional)

```bash
# CLI expects a JSON array of workflows (UI import accepts the single-object file as-is):
jq -s . integrations/n8n/track-stripe-mrr-daily.json | n8n import:workflow --input=/dev/stdin
```

Credentials are not bundled; assign MCP Client credentials after import.