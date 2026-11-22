# GraphMyAnything

**Chart & metric memory for AI agents.**

[`graphmyanything-mcp`](https://www.npmjs.com/package/graphmyanything-mcp) is a local-first [Model Context Protocol](https://modelcontextprotocol.io) server: store time-series metrics in SQLite, answer chart questions with token-efficient tool calls instead of throwaway Python, and render SVG charts on disk. No cloud required for core flows.

**Registry name:** `io.github.casahome2000/graphmyanything-mcp` · **License:** MIT

## Quick start

```bash
claude mcp add graphmyanything -- npx -y graphmyanything-mcp@0.1.1
```

Then ask your agent: *Track my MRR of 84,210 today, then chart the last 90 days and tell me the trend.*

## What it does

1. **Track** values (single points, batches, or historical series).
2. **Query** compact numeric summaries and optional downsampled points within a token budget.
3. **Insight** plain-English trend, anomalies, and a simple forecast.
4. **Chart** dark/light SVG files locally — `path` on disk; **`url` is `null`** until hosted live charts ship (see `hosted_url_note` in the response).

Data stays on your machine unless you opt into future cloud APIs.

## Install

**Node.js 22.13+** (built-in `node:sqlite`, no native compile step):

```bash
npx -y graphmyanything-mcp
```

Published package: **0.1.1** — `npx -y graphmyanything-mcp@0.1.1`

### Local paths & env vars

| Location | Default |
|----------|---------|
| SQLite DB | `~/.graphmyanything/metrics.db` |
| Chart SVGs | `~/.graphmyanything/charts/` |

| Variable | Purpose |
|----------|---------|
| `GRAPHMYANYTHING_DB_PATH` | Custom SQLite file path |
| `GRAPHMYANYTHING_CHARTS_DIR` | Custom chart output directory (otherwise `charts/` next to the DB when the DB path is custom) |

**No telemetry** in the MCP server — we do not phone home from your agent sessions.

## Tools (four)

| Tool | One-liner | Tiny example |
|------|-----------|--------------|
| **track** | Write metric point(s) to local SQLite | `track(metric="stripe.mrr", value=84210, tags={"plan":"pro"})` |
| **query** | Compact summary (latest, min, max, mean, trend, % change), optional downsampled points within a token budget | `query(metric="stripe.mrr", range="90d", token_budget=200, points="auto")` |
| **insight** | Plain-English trend, anomalies, and a simple forecast | `insight(metric="stripe.mrr", range="90d")` |
| **chart** | SVG to local file; no public URL yet | `chart(metric="stripe.mrr", range="90d", type="area", theme="dark")` → `{"path":"…/stripe.mrr-….svg","url":null,"hosted_url_note":"Hosted live chart URLs are coming soon: graphmyanything.com"}` |

Schema details match [`packages/mcp-server/src/tool-catalog.ts`](packages/mcp-server/src/tool-catalog.ts).

## Client config

### Cursor

`.cursor/mcp.json` or **Settings → MCP**:

```json
{
  "mcpServers": {
    "graphmyanything": {
      "command": "npx",
      "args": ["-y", "graphmyanything-mcp@0.1.1"]
    }
  }
}
```

### Claude Desktop

`claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "graphmyanything": {
      "command": "npx",
      "args": ["-y", "graphmyanything-mcp@0.1.1"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add graphmyanything -- npx -y graphmyanything-mcp@0.1.1
```

## n8n

Scheduled **track → query → insight → chart** template: [`integrations/n8n/`](integrations/n8n/) (import `track-stripe-mrr-daily.json`, MCP Client stdio, pin `graphmyanything-mcp@0.1.1`).

## Why tokens matter (one chart question)

Reproducible benchmark: [`benchmarks/token-benchmark/`](benchmarks/token-benchmark/) — run `npm run benchmark:tokens` from a full repo checkout.

**End-to-end agent tokens** (single “show me the chart + trend” flow, **single question, end-to-end (cold)**):

| Approach | Tokens |
|----------|--------|
| Inline JSON + matplotlib in chat | **2,447** |
| Python file off-context (E2E) | **658** |
| **GMA lean** (`query` + `chart`, `points=auto`, `also_chart`) | **284** (**56.8% fewer** than file E2E) |

**file E2E warm × 30** **21,390** vs **GMA lean** **8,520** (**60.2% fewer**).

**Caveats (read before citing):**

- Synthetic MRR series and simulated tool turns — not a live agent trace.
- MCP **tool schema overhead** ~342 tokens vs ~248 for a minimal Python harness (see benchmark tables).
- **Best-case** file Python (pre-cached script, no discovery) ≈ **167** tokens — optimistic floor, not typical agent E2E.

A script that already exists and needs no discovery can still be cheaper (~167 tokens); GraphMyAnything wins on the full workflow and on repeat questions.

## Hosted live charts (coming soon)

The `chart` tool writes SVG files locally today. Public URLs at **graphmyanything.com** are on the roadmap for founding members — [join the waitlist](https://graphmyanything.com).

## Repo map

| Path | Contents |
|------|----------|
| [`packages/mcp-server/`](packages/mcp-server/) | npm package, tests, `server.json` |
| [`integrations/n8n/`](integrations/n8n/) | Workflow template |
| [`benchmarks/token-benchmark/`](benchmarks/token-benchmark/) | Token comparison + chart |
| [`docs/DEVELOPING.md`](docs/DEVELOPING.md) | Landing-site developer notes |
| [`legacy/`](legacy/) | 2016 Flask archive |

## Develop the MCP server

```bash
cd packages/mcp-server && npm install && npm run build && npm test
```

## License

MIT — see [`packages/mcp-server/LICENSE`](packages/mcp-server/LICENSE).
