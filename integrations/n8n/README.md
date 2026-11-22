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
4. Arguments: `-y`, `graphmyanything-mcp`
5. Ensure Node 20+ on the n8n worker.

On the imported workflow:

- Disable **HTTP track (cloud placeholder)**.
- Attach your credential to **MCP track**, **MCP query 90d**, **MCP insight**, and **MCP chart SVG**.
- Replace **Mock Stripe MRR** with a Stripe node or your billing HTTP source when ready.

## Flow

1. Schedule (daily 9:00).
2. Read MRR (mock code node in template).
3. `track` → `query` (90d, token_budget 300) → `insight` → `chart` (area, dark).

Chart files land on the n8n host under `~/.graphmyanything/charts/`. Permanent live URLs at https://graphmyanything.com/c/&lt;metric&gt; are planned for founding members.