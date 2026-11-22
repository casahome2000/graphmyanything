# Token benchmark (hardened)

## Headline (defensible)

**What we can claim:** When agents **paste the series into chat** (inline JSON + matplotlib), cost explodes with data size — **2,290** tokens at 90 points vs **799** for GMA (`−65.1%`), and **120,131** vs **799** at 5,000 points (`−99.3%`). GMA `query`+`chart` stays ~flat because history lives in metric memory, not the prompt.

**What we cannot claim:** Minimal **file-based Python** (data on disk, never loaded into context) is **203** tokens/session — **+293.6% more** than GMA on this benchmark. That path is the honest ceiling; GMA trades higher per-question tokens for MCP ergonomics, persistent memory, LTTB summaries, and optional `insight` without re-writing scripts.

**30-session persistence:** Inline-json totals **68,700** tokens (re-attaches full JSON each day) vs GMA **23,970** (`−65.1%`) with **n8n/cron `track`** ingestion (**0** ingest tokens per session). File-Python cumulative: **6,090** (still lowest token count; agent re-runs script each time).

**Prompt:** "Chart my last 90 days of MRR and tell me the trend."

**Tokenizer:** `js-tiktoken` / `o200k_base`

## Single-session totals (input + output, incl. 1.15× retry on Python paths)

| Points | Inline JSON + mpl | File Python | GMA query+chart | GMA vs inline | GMA vs file |
|--------|-------------------|-------------|-----------------|---------------|-------------|
| 90 | 2,290 | 203 | 799 | −65.1% | +293.6% more |
| 365 | 8,890 | 203 | 799 | −91% | +293.6% more |
| 5000 | 120,131 | 204 | 799 | −99.3% | +291.7% more |

## GMA ingestion (outside the chart question)

| Scenario | Tokens in agent flow | Per-session amortized (30 sessions) |
|----------|----------------------|-----------------------------------------------|
| n8n/cron track (recommended) | 0 | 0 |
| One-time agent backfill | 1,110 | 37 |
| Agent track every day (anti-pattern) | 1,020 | 34 |

One-time `track(points[90])` backfill costs **1,110** tokens (counted separately from query/chart). **Recommended:** n8n/cron `track` so chart questions stay at **799** tokens.

## 30-session cumulative (90-point window; no re-ingest for GMA)

| Approach | Per session | × 30 sessions |
|----------|-------------|----------------------|
| Inline JSON + matplotlib | 2,290 | **68,700** |
| File-based Python | 203 | **6,090** |
| GMA query + chart (n8n ingest) | 799 | **23,970** |

## Answer quality (one turn unless noted)

| Approach | Trend | % change | Anomalies | Chart artifact | Extra turns for anomalies |
|----------|-------|----------|-----------|----------------|---------------------------|
| Inline JSON + matplotlib | Yes (printed / prose, 1 turn) | Yes (code prints %) | No (needs extra analysis turn) | PNG path in reply | 1 |
| File-based Python | Yes (prints + prose, 1 turn) | Yes (printed stats) | No (no robust detector in template) | PNG on disk | 1 |
| GMA query + chart | Yes (summary.trend=up) | Yes (summary.pct_change=14.68) | No on query alone | SVG path (not inlined) | 1 |
| GMA + insight (optional 3rd tool) | Yes | Yes | Yes (5 flagged, 1 extra tool) | Same as query + chart | 0 |

## Caveats

- **Synthetic MRR** series; point counts (90 / 365 / 5000) scale **payload size** for inline JSON, not always literal calendar windows.
- **Python outputs** are representative templates; real agents vary in verbosity, libraries, and retries (we apply **1.15×** on Python output only).
- **File Python** assumes the model respects "do not load file into chat"; cheating by reading the file into context collapses toward the inline baseline.
- **GMA `chart`** returns a **path**, not image bytes — compared fairly to Python saving PNG on disk, not base64 in chat.
- **Anomalies** on GMA require `insight` (modeled as +1 tool turn); `query` alone matches Python on anomalies (none without extra work).
- **Tokenizer** is `o200k_base`; counts differ slightly on Claude/Gemini tokenizers (usually within a few %).
- This measures **LLM context/tool tokens**, not local CPU, Stripe API, or n8n runtime.

## Reproduce

```bash
cd benchmarks/token-benchmark
npm install
npm run run
```

From repo root: `npm run benchmark:tokens`

Outputs: `results.md`, `token-benchmark.svg`, `token-benchmark.png` (1200×880 @2× for social).

![Token benchmark](./token-benchmark.svg)
