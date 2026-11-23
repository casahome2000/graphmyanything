# GraphMyAnything — agent & developer guide

**Positioning:** *Build once. Ask forever.* Load or record a time series once; later questions use **stored history** in a few hundred tokens instead of another research pass, API round-trip, or matplotlib detour.

This guide answers: **when to keep, store, update, and use** local metric memory — for humans wiring MCP and for agents choosing tools.

A condensed copy ships as the MCP resource **`usage-guide`** (`graphmyanything://docs/usage-guide`). Chart styling has **`chart-guide`**.

---

## The four tools

| Tool | Purpose |
|------|---------|
| **track** | Write one or many `(timestamp, value)` rows to SQLite |
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

## Idempotency and duplicates

Implementation: each `track` runs **`INSERT`** into `metric_points`. There is **no unique constraint** on `(metric, ts)`.

| Action | Result |
|--------|--------|
| `track` with `value` only | One row at **current** Unix time (seconds) |
| `track` with `points[]` | One row per point; missing `ts` → current time |
| Same `metric` + same `ts` again | **Another row** — not an update |
| `query` / `insight` / `chart` | All rows in range, **ORDER BY ts ASC** |

**Corrections:** There is **no delete** or **patch** tool in 0.1.x. To fix a value you can:

1. `track` the corrected value at the intended `ts` — knowing **duplicates may appear** if the old row remains.
2. Manually edit or replace the SQLite DB (`~/.graphmyanything/metrics.db` or `GRAPHMYANYTHING_DB_PATH`).

**Batch tags:** Top-level `tags` merge into each point; per-point `tags` override on key collision.

---

## Backfill once, then incremental

1. **Backfill:** `track` with `points: [{ value, ts }, …]` from CSV, census, or API history.
2. **Incremental:** `track` with `value` (and optional `tags`) on a schedule (cron, n8n, agent daily habit).

Avoid re-backfilling the entire series on every run unless the source is authoritative and you accept duplicate timestamps.

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

- Data persists until the DB file is removed or overwritten.
- **No MCP delete tool** in 0.1.x — no per-metric wipe, no upsert.
- To reset: delete `metrics.db` (and optional charts under `~/.graphmyanything/charts/` or `GRAPHMYANYTHING_CHARTS_DIR`).

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

- **`tools/list`** — four tools; chart details are shortened; see resources for guides.
- **`resources/list`** — `chart-guide`, `usage-guide`.
- **Initialize `instructions`** — short pointer to read those resources.

Human-readable docs in this repo:

- [Quick start](./quickstart.md)
- [Examples](./examples.md)

---

## Behavior gaps (0.1.x)

| Gap | Workaround |
|-----|------------|
| No delete / upsert | Manual SQLite edit or new metric name |
| Duplicate `ts` rows | Avoid re-track at same second; or accept duplicate points |
| `chart` `url` always null | Open local `path` |
| No server-side schema migration UI | Single `metric_points` table, created on first open |

Feature requests welcome on [GitHub Issues](https://github.com/casahome2000/graphmyanything/issues).