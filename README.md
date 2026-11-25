# GraphMyAnything

**<!-- fact:copy.headline -->Build once. Ask forever.<!-- /fact -->**

[`graphmyanything-mcp`](https://www.npmjs.com/package/graphmyanything-mcp) is a local-first [Model Context Protocol](https://modelcontextprotocol.io) server: store time-series metrics in SQLite, answer chart questions with token-efficient tool calls instead of throwaway Python, and render SVG charts on disk. Optional **hosted sync** adds shareable chart links while keeping a local backup.

**Registry name:** `io.github.casahome2000/graphmyanything-mcp` · **License:** MIT

**Pricing:** [graphmyanything.com](https://graphmyanything.com) — **Free:** <!-- fact:plans.free.metrics -->3<!-- /fact --> metrics, <!-- fact:plans.free.points fmt:compactK -->10k<!-- /fact --> points, <!-- fact:plans.free.readDays -->90<!-- /fact -->-day reads, <!-- fact:plans.free.shareLinks -->3<!-- /fact --> share links; **Founding:** <!-- fact:plans.founding.priceUsd fmt:usd0 -->$49<!-- /fact --> for the first <!-- fact:plans.founding.termMonths -->12<!-- /fact --> months, then <!-- fact:plans.founding.thenMonthlyUsd fmt:usd0 -->$9<!-- /fact -->/mo (auto-renews; cancel anytime).

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

**Pin a version (optional):** `npx -y graphmyanything-mcp@<!-- fact:package.version -->0.2.4<!-- /fact -->`

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

## Tools (<!-- fact:tools.count fmt:word -->five<!-- /fact -->)

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

Scheduled **track → query → insight → chart** template: [`integrations/n8n/`](integrations/n8n/) (import `track-stripe-mrr-daily.json`, MCP Client stdio, `graphmyanything-mcp@latest` with optional pin `<!-- fact:package.version -->0.2.4<!-- /fact -->`).

## Why tokens matter (one chart question)

Reproducible benchmark: [`benchmarks/token-benchmark/`](benchmarks/token-benchmark/) — from the repo root, run `npm run benchmark:tokens` (after `npm ci` in that directory).

**End-to-end agent tokens** (single “show me the chart + trend” flow, **single question, end-to-end (cold)**):

| Approach | Tokens |
|----------|--------|
| Inline JSON + matplotlib in chat | **<!-- fact:benchmark.inlineE2ETokens fmt:int -->2,447<!-- /fact -->** |
| Python file off-context (E2E) | **<!-- fact:benchmark.fileE2ETokens fmt:int -->658<!-- /fact -->** |
| **GMA lean** (`query` + `chart`, default hosted chart) | **<!-- fact:benchmark.leanTokens fmt:int -->288<!-- /fact -->** (**<!-- fact:benchmark.leanReductionPct -->56.2<!-- /fact -->% fewer** than file E2E) |
| **GMA lean** + `include_embed: true` | **<!-- fact:benchmark.embedTokens fmt:int -->344<!-- /fact -->** (**<!-- fact:benchmark.embedReductionPct -->47.7<!-- /fact -->% fewer**) |

**30 warm sessions (per-session GMA lean <!-- fact:benchmark.leanTokens -->288<!-- /fact -->):** file E2E warm cumulative **<!-- fact:benchmark.warm30.fileTokens fmt:int -->21,390<!-- /fact -->** vs **GMA lean** **<!-- fact:benchmark.warm30.gmaTokens fmt:int -->8,640<!-- /fact -->** (**<!-- fact:benchmark.warm30.reductionPct -->59.6<!-- /fact -->% fewer**).

**Cost per 1,000 identical questions** (<!-- fact:benchmark.costModel.label -->GPT-5.2<!-- /fact --> at $<!-- fact:benchmark.costModel.inputPerMillionUsd -->1.75<!-- /fact -->/M input · $<!-- fact:benchmark.costModel.outputPerMillionUsd -->14<!-- /fact -->/M output — see [`results.md`](benchmarks/token-benchmark/results.md)): file E2E cold **<!-- fact:benchmark.costPer1kQuestionsUsd.file fmt:usd -->$6.00<!-- /fact -->** vs GMA lean **<!-- fact:benchmark.costPer1kQuestionsUsd.lean fmt:usd -->$1.66<!-- /fact -->**. Dollar lines scale linearly if your model’s per-token pricing differs.

**Caveats (read before citing):**

- Modeled flows from [`e2e-flows.ts`](benchmarks/token-benchmark/e2e-flows.ts), not live agent traces — counts are reproducible via `npm run benchmark:tokens`.
- MCP **tool schema overhead** **<!-- fact:tools.listTokens -->468<!-- /fact -->** tokens (<!-- fact:tools.count -->5<!-- /fact --> tools, `<!-- fact:benchmark.tokenizer -->o200k<!-- /fact -->`) vs **<!-- fact:benchmark.pythonHarnessListTokens -->248<!-- /fact -->** for a representative 6-tool Python harness (see benchmark tables); caching often applies schemas once after turn 1.
- **Best-case** file Python (pre-cached script, no discovery) ≈ **<!-- fact:benchmark.bestCaseScriptTokens -->167<!-- /fact -->** tokens — deliberate lower bound; citing without full E2E is misleading.

A script that already exists and needs no discovery can still be cheaper (~<!-- fact:benchmark.bestCaseScriptTokens -->167<!-- /fact --> tokens); GraphMyAnything wins on the full workflow and on repeat questions.

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
