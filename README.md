# GraphMyAnything

**Build once. Ask forever.**

[`graphmyanything-mcp`](https://www.npmjs.com/package/graphmyanything-mcp) is a local-first [Model Context Protocol](https://modelcontextprotocol.io) server: store time-series metrics in SQLite, answer chart questions with token-efficient tool calls instead of throwaway Python, and render SVG charts on disk. Optional **hosted sync** adds shareable chart links while keeping a local backup.

**Registry name:** `io.github.casahome2000/graphmyanything-mcp` · **License:** MIT

**Pricing:** [graphmyanything.com](https://graphmyanything.com) — **Free:** 3 metrics, 10k points, 90-day reads, 3 share links; **Founding:** $49 for the first 12 months, then $9/mo (auto-renews; cancel anytime).

## Start here

| Doc | Audience |
|-----|----------|
| [Quick start (5 min)](./docs/quickstart.md) | Install in Cursor, Claude, VS Code, Windsurf, Docker |
| [Examples](./docs/examples.md) | Copy-paste prompts, tool JSON, sample responses |
| [Agent guide](./docs/agent-guide.md) | When to keep, store, update, and use metrics |

MCP resources for agents: **`usage-guide`**, **`chart-guide`** (not duplicated in `tools/list`).

## Quick start

```bash
claude mcp add graphmyanything -- npx -y graphmyanything-mcp@latest
```

Then ask your agent: *Track my MRR of 84,210 today, then chart the last 90 days and tell me the trend.*

## What it does

1. **Track** values (single points, batches, or historical series).
2. **Query** compact numeric summaries and optional downsampled points within a token budget.
3. **Insight** plain-English trend, anomalies, and a simple forecast.
4. **Forget** hard-delete points, ranges, or a whole metric (`confirm` when `all: true`).
5. **Chart** dark/light **640×320 SVG** locally; in **hosted** mode returns share `url` (`https://graphmyanything.com/c/<id>`). `include_embed: true` adds embed URLs; `share: false` omits the public URL. Tool payloads include `tokens_estimate` (chars ÷ 4, approximate).

Data stays on your machine by default. **`graphmyanything-mcp sync`** (v0.2+) opts into hosted mode with device-code auth while keeping a local SQLite backup. See [quickstart](./docs/quickstart.md) and [hosted API contract](./docs/hosted-api.md).

## Install

**Node.js 22.13+** (built-in `node:sqlite`, no native compile step):

```bash
npx -y graphmyanything-mcp@latest
```

**Pin a version (optional):** `npx -y graphmyanything-mcp@0.2.3`

### Local paths & env vars

| Location | Default |
|----------|---------|
| SQLite DB | `~/.graphmyanything/metrics.db` |
| Chart SVGs | `~/.graphmyanything/charts/` |

| Variable | Purpose |
|----------|---------|
| `GRAPHMYANYTHING_DB_PATH` | Custom SQLite file path |
| `GRAPHMYANYTHING_CHARTS_DIR` | Custom chart output directory (otherwise `charts/` next to the DB when the DB path is custom) |
| `GRAPHMYANYTHING_MODE` | Set to `local` to force local mode |
| `GRAPHMYANYTHING_API_KEY` / `GMA_API_KEY` | Hosted mode API key (overrides config file) |
| `GRAPHMYANYTHING_CONFIG_PATH` | Custom path for `config.json` (default `~/.graphmyanything/config.json`, mode `0600`) |
| `GRAPHMYANYTHING_API_BASE` | Override hosted API base (testing) |

**No telemetry** in the MCP server — we do not phone home from your agent sessions.

## Tools (five)

| Tool | One-liner | Tiny example |
|------|-----------|--------------|
| **track** | Upsert point(s) by (metric, ts); returns `written` + `replaced` | `track(metric="stripe.mrr", value=84210, tags={"plan":"pro"})` |
| **forget** | Delete point, range, or whole metric (`confirm` when `all:true`) | `forget(metric="stripe.mrr", ts=1732147200)` |
| **query** | Compact summary (latest, min, max, mean, trend, % change), optional downsampled points within a token budget | `query(metric="stripe.mrr", range="90d", token_budget=200, points="auto")` |
| **insight** | Plain-English trend, anomalies, and a simple forecast | `insight(metric="stripe.mrr", range="90d")` |
| **chart** | Labeled **640×320 SVG**; **local:** `path`; **hosted:** share `url` by default; `include_embed: true` for embed URLs; `share: false` keeps local-only | `chart(...)` → `url` and/or local `path` |

Schema details match [`packages/mcp-server/src/tool-catalog.ts`](packages/mcp-server/src/tool-catalog.ts).

Pure chart/summary/insight logic (no I/O) lives in [`packages/core`](packages/core/) for pinning or copying into other apps.

## Client config

### Cursor

`.cursor/mcp.json` or **Settings → MCP**:

```json
{
  "mcpServers": {
    "graphmyanything": {
      "command": "npx",
      "args": ["-y", "graphmyanything-mcp@latest"]
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
      "args": ["-y", "graphmyanything-mcp@latest"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add graphmyanything -- npx -y graphmyanything-mcp@latest
```

## n8n

Scheduled **track → query → insight → chart** template: [`integrations/n8n/`](integrations/n8n/) (import `track-stripe-mrr-daily.json`, MCP Client stdio, `graphmyanything-mcp@latest` with optional pin `0.2.3`).

## Why tokens matter (one chart question)

Reproducible benchmark: [`benchmarks/token-benchmark/`](benchmarks/token-benchmark/) — from the repo root, run `npm run benchmark:tokens` (after `npm ci` in that directory).

**End-to-end agent tokens** (single “show me the chart + trend” flow, **single question, end-to-end (cold)**):

| Approach | Tokens |
|----------|--------|
| Inline JSON + matplotlib in chat | **2,447** |
| Python file off-context (E2E) | **658** |
| **GMA lean** (`query` + `chart`, default hosted chart) | **288** (**56.2% fewer** than file E2E) |
| **GMA lean** + `include_embed: true` | **344** (**47.7% fewer**) |

**30 warm sessions (per-session GMA lean 288):** file E2E warm cumulative **21,390** vs **GMA lean** **8,640** (**59.6% fewer**).

**Cost per 1,000 identical questions** (GPT-5.2 at $1.75/M input · $14/M output — see [`results.md`](benchmarks/token-benchmark/results.md)): file E2E cold **$6.00** vs GMA lean **$1.66**. Dollar lines scale linearly if your model’s per-token pricing differs.

**Caveats (read before citing):**

- Modeled flows from [`e2e-flows.ts`](benchmarks/token-benchmark/e2e-flows.ts), not live agent traces — counts are reproducible via `npm run benchmark:tokens`.
- MCP **tool schema overhead** **468** tokens (5 tools, `o200k`) vs **248** for a representative 6-tool Python harness (see benchmark tables); caching often applies schemas once after turn 1.
- **Best-case** file Python (pre-cached script, no discovery) ≈ **167** tokens — deliberate lower bound; citing without full E2E is misleading.

A script that already exists and needs no discovery can still be cheaper (~167 tokens); GraphMyAnything wins on the full workflow and on repeat questions.

## Hosted live charts

Run `npx -y graphmyanything-mcp@latest sync` to link a free account. Your local history uploads, and `chart` returns a live share link at `https://graphmyanything.com/c/<id>` by default (`include_embed: true` when you need embed URLs). Pass `share: false` to keep a chart local. Plan limits and billing: [graphmyanything.com](https://graphmyanything.com).

## Repo map

| Path | Contents |
|------|----------|
| [`packages/mcp-server/`](packages/mcp-server/) | npm package, tests, `server.json` |
| [`integrations/n8n/`](integrations/n8n/) | Workflow template |
| [`benchmarks/token-benchmark/`](benchmarks/token-benchmark/) | Token comparison + chart |

## Develop the MCP server

```bash
cd packages/mcp-server && npm install && npm run build && npm test
```

## License

MIT — see [`packages/mcp-server/LICENSE`](packages/mcp-server/LICENSE).
