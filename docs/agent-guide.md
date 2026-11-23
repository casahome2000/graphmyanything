# GraphMyAnything — agent & developer guide

**Positioning:** *Build once. Ask forever.* Load or record a time series once; later questions use **stored history** in a few hundred tokens instead of another research pass, API round-trip, or matplotlib detour.

This guide answers: **when to keep, store, update, and use** local metric memory — for humans wiring MCP and for agents choosing tools.

A condensed copy ships as the MCP resource **`usage-guide`** (`graphmyanything://docs/usage-guide`). Chart styling has **`chart-guide`**.

---

## The five tools

| Tool | Purpose |
|------|---------|
| **track** | Upsert one or many `(timestamp, value)` rows by `(metric, ts)` |
| **forget** | Delete point, range, or whole metric (`metric` always required) |
| **query** | Terse numeric summary + optional LTTB downsampled `pts` within `token_budget` |
| **insight** | Plain-English trend, MAD-based anomalies, naive linear forecast |
| **chart** | 640×320 SVG on disk; `path` is local, `url` is always `null` today |

Every tool response includes **`tokens_estimate`** (JSON string length ÷ 4 — approximate, not a tokenizer count).

---

## When to **track** (store)

**Do track when:**

- The user will ask again about this number or series.
- The value is part of a **time series** (daily MRR, weight, fleet count, test pass rate).
- Fetching it is **slow, rate-limited, or expensive** (Stripe dashboard, census tables, custom APIs).
- You've **already researched** a public series once (population, stock close) and want recall without repeating work.

**Do not track when:**

- The value is **one-off** with no future chart or compare intent ("what is 2+2").
- The payload is **secret** (API keys, session tokens) or **PII** you would not write to a local debug log.
- The user explicitly wants a **live** reading every time — track only after fetch if they also want history.

**Naming:** Prefer dotted paths with an optional unit suffix:

- `health.weight.lb`
- `stripe.mrr.usd`
- `geo.plano_tx.population`
- `app.api.p99_latency.ms`

Use **`tags`** for dimensions (`plan`, `source`, `env`), not for the primary unit string.

**Units:** Encode the canonical unit in the metric name when ambiguity matters. Values are stored as plain numbers; the agent should not silently mix lb vs kg on the same metric name.

---

## Upsert and corrections

SQLite enforces **`UNIQUE(metric, ts)`**. On first open, existing DBs **dedupe** legacy duplicates (keeps the row with the highest `id`).

| Action | Result |
|--------|--------|
| `track` with `value` only | Upsert at **current** Unix time (seconds) |
| `track` with `points[]` | Upsert per point; missing `ts` → current time |
| Same `metric` + same `ts` again | **Replace** value/tags; `replaced` += 1 |
| Response | `written` (new timestamps) + `replaced` (updated timestamps) |

**Corrections:** `track` again at the same `ts` with the fixed value — no duplicate point.

**Batch tags:** Top-level `tags` merge into each point; per-point `tags` override on key collision.

## **forget** (delete)

| Mode | Arguments |
|------|-----------|
| Single point | `metric` + `ts` |
| Range (inclusive) | `metric` + `from` + `to` (Unix seconds) |
| Entire metric | `metric` + `all: true` + **`confirm: true`** |

Never call `forget` without **`metric`**. Returns `{ deleted }`.

---

## Backfill once, then incremental

1. **Backfill:** `track` with `points: [{ value, ts }, …]` from CSV, census, or API history.
2. **Incremental:** `track` with `value` (and optional `tags`) on a schedule (cron, n8n, agent daily habit).

Avoid re-backfilling the entire series on every run unless the source is authoritative — upsert will update overlapping timestamps.

---

## When to **query** vs **insight** vs **chart**

```
Need numbers only, token-shaped?  ──► query
Need spoken summary + anomalies?  ──► insight
Need a file the human opens?    ──► chart
```

### query

- Default `token_budget`: **500**.
- **`points`:** `0` = summary only; **`auto`** (default) = include LTTB series when budget allows; **`N`** = up to N LTTB points.
- **`also_chart: true`:** With `points: auto`, **omits `pts`** so you can call `chart` next without redundant series JSON.
- Terse summary keys: `s.l` (latest), `s.mn`, `s.mx`, `s.mu`, `s.tr`, `s.pct`, `s.n`.

### insight

- Use when the user asks *"what's the trend?"*, *"anything weird?"*, or *"forecast next few days"* in natural language.
- Heavier payload than `query` — still far smaller than dumping raw series into chat.

### chart

- Use when the user should **see** the series (report, slide, IDE preview).
- Read MCP resource **`chart-guide`** for `type`, `theme`, `labels`, `range`.
- Defaults: `type=line`, `theme=dark`, `labels=last`.

**Efficient combo:** `query(..., also_chart: true)` then `chart(...)` — see [token benchmark](../benchmarks/token-benchmark/).

---

## Freshness: re-fetch vs trust storage

| Situation | Guidance |
|-----------|----------|
| Historical analysis, "since we started tracking" | Trust **stored** data |
| "What is MRR **right now**?" | **Re-fetch** source, then optionally **track** to extend the series |
| Known business event (price change, deploy) | Re-fetch after the event |
| Stored latest point older than the metric's SLA | Re-fetch |
| Public series never tracked before | One fetch + **backfill** `track`, then query/chart from store |

Storage is **local truth for what was recorded**, not a live mirror of third-party systems unless you automate updates.

---

## Retention and deletion

- Data persists until you **`forget`** it or remove the DB file.
- **`forget`** handles point, range, or metric-level delete (with `confirm` for `all:true`).
- Nuclear reset: delete `metrics.db` (and optional charts under `~/.graphmyanything/charts/` or `GRAPHMYANYTHING_CHARTS_DIR`).

**Why a `forget` tool (not delete flags on `track`)?** Delete modes need five optional fields; folding them into `track` bloats the busiest tool in `tools/list`. A compact fifth tool keeps `track` focused on upsert and costs fewer list tokens than an oversized `track` schema.

---

## Token cost guidance

- Prefer **`query` with `points: 0` or `also_chart`** over pasting large JSON in chat.
- Set **`token_budget`** to match the model context you can spare (200–300 for dashboard-style answers).
- Use **`insight` once** per question — don't chain redundant `insight` + full series dumps.
- **`chart` returns metadata only** — the SVG stays on disk, not in the model context (unless the client attaches the file).
- Compare approaches: [`benchmarks/token-benchmark/`](../benchmarks/token-benchmark/).

Responses' **`tokens_estimate`** helps agents self-throttle; it counts the **tool result JSON**, not chart file bytes.

---

## MCP discovery (for agent authors)

- **`tools/list`** — five tools (`track`, `forget`, `query`, `insight`, `chart`); chart details shortened — see resources.
- **`resources/list`** — `chart-guide`, `usage-guide`.
- **Initialize `instructions`** — short pointer to read those resources.

Human-readable docs in this repo:

- [Quick start](./quickstart.md)
- [Examples](./examples.md)

---

## Known limits (0.1.x)

| Limit | Workaround |
|-------|------------|
| `chart` `url` is null | Local mode or `share:false`: open the local `path`; run `sync` for live links |
| No cloud sync | Local SQLite only |

Feature requests welcome on [GitHub Issues](https://github.com/casahome2000/graphmyanything/issues).