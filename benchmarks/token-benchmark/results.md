# Token benchmark (end-to-end)

## Headline (defensible)

> End-to-end (excl. tool defs), GMA lean is **288** tokens vs **658** file-Python (**56.2% fewer**), with **511**-token MCP schemas vs **248**-token file/shell harness schemas.

**Best-case file Python (~167 tokens) is ~4× too low.** Measured **end-to-end** file flow (search → locate → schema → script → pip → run → **shared final answer**): **658** tokens (8.6 turns, 6.3 tool calls).

**GMA lean (`points=auto`, `also_chart`, default chart):** **194** in · **94** out · **288** total — 56.2% fewer than file E2E cold (658). **GMA lean + `include_embed: true`:** **344**. **GMA full (`points=50`):** **1,496** (1,402 in · 94 out).

**vs inline JSON E2E:** lean 288 vs 2,447 (88.2% fewer).

**30 warm sessions:** file E2E warm 21,390 · GMA lean 8,640 (59.6% fewer vs file warm) · inline 71,610.

**Cost @ 1,000 Q (GPT-5.2, in $1.75/M · out $14/M):** file E2E cold **$6.00** · GMA lean **$1.66** · GMA full **$3.77**.

## Assumptions (transparent)

| Item | Value |
|------|--------|
| User prompt | "Chart my last 90 days of MRR and tell me the trend." |
| Data size | 90 daily MRR points (synthetic) |
| Tokenizer | `js-tiktoken` / `o200k_base` |
| Token rule | Tool results enter context (input). Assistant text and tool-call args are output. |
| GMA lean query | `points=auto` + `also_chart=true` → summary only (`s.*` terse keys) |
| GMA full query | `points=50` — LTTB series in `pts` |
| Error+fix retry | 30% of flows; fail+fix steps weighted in totals |
| Warm session | Agent has **no memory** of prior script; re-lists / re-attaches data |
| GMA ingestion | **n8n/cron `track`** — 0 tokens inside question flow |
| Best-case Python | Single code-gen turn only; data path stated, not discovered |
| Cost model | GPT-5.2: $1.75/1M in, $14/1M out |

### E2E step model (Python file cold)

- **Plan + search tools** — Model emits codebase_search and rg calls (2 tool calls)
- **Search results** — Tool results return to context (0 tool calls)
- **list_dir + glob** — Model calls filesystem tools (2 tool calls)
- **Listing results** — Directory listings in context (0 tool calls)
- **Schema preview** — Head rows tool result in context (0 tool calls)
- **pip / import check** — Model runs env tools (1 tool calls)
- **pip install results** — stderr/stdout from tools in context (1 tool calls)
- **Final answer to user** — stdout tool result in context; shared closing message (0 tool calls)
- **Run failure (stderr)** — 30% weighted (0 tool calls, weight 0.3)
- **Fix + re-run stdout** — Weighted retry path (1 tool calls, weight 0.3)

## End-to-end token totals

| Flow | Input (context) | Output (model) | **Total** | Turns | Tool calls |
|------|-----------------|----------------|-----------|-------|------------|
| Python file E2E (cold start) | 262 | 396 | **658** | 8.6 | 6.3 |
| Python file E2E (warm, re-discovery) | 180 | 533 | **713** | 6.6 | 4.3 |
| Python inline JSON E2E (cold) | 1,219 | 1,228 | **2,447** | 5.6 | 3.3 |
| Python inline JSON E2E (warm) | 1,170 | 1,217 | **2,387** | 4.6 | 2.3 |
| GMA query+chart lean (auto pts, also_chart) | 194 | 94 | **288** | 3 | 2 |
| GMA lean + chart include_embed | 250 | 94 | **344** | 3 | 2 |
| GMA query+chart full (pts=50) | 1,402 | 94 | **1,496** | 3 | 2 |
| Best-case file Python (1 turn) | 56 | 111 | **167** | 1 | 0 |

## Per-step breakdown (auditable)

### Python file E2E (cold start)

| Step | In (context) | Out (model) | Total |
|------|----------------|-------------|-------|
| Plan + search tools | 17 | 36 | 53 |
| Search results | 57 | 18 | 75 |
| list_dir + glob | 8 | 22 | 30 |
| Listing results | 36 | 19 | 55 |
| Schema preview | 56 | 229 | 285 |
| pip / import check | 10 | 12 | 22 |
| pip install results | 31 | 14 | 45 |
| Final answer to user | 33 | 40 | 73 |
| Run failure (stderr) | 6 | 3 | 9 |
| Fix + re-run stdout | 8 | 3 | 11 |
| **Sum** | **262** | **396** | **658** |

### Python file E2E (warm, re-discovery)

| Step | In (context) | Out (model) | Total |
|------|----------------|-------------|-------|
| Re-discovery tools | 17 | 17 | 34 |
| Re-discovery results | 39 | 12 | 51 |
| Rewrite script | 8 | 215 | 223 |
| Schema preview | 56 | 229 | 285 |
| pip show | 13 | 14 | 27 |
| Final answer to user | 33 | 40 | 73 |
| Run failure (stderr) | 6 | 3 | 9 |
| Fix + re-run stdout | 8 | 3 | 11 |
| **Sum** | **180** | **533** | **713** |

### Python inline JSON E2E (cold)

| Step | In (context) | Out (model) | Total |
|------|----------------|-------------|-------|
| Search + attach JSON | 1,125 | 8 | 1,133 |
| Inline matplotlib script | 6 | 1,148 | 1,154 |
| pip / import check | 10 | 12 | 22 |
| pip install results | 31 | 14 | 45 |
| Final answer to user | 33 | 40 | 73 |
| Run failure (stderr) | 6 | 3 | 9 |
| Fix + re-run stdout | 8 | 3 | 11 |
| **Sum** | **1,219** | **1,228** | **2,447** |

### Python inline JSON E2E (warm)

| Step | In (context) | Out (model) | Total |
|------|----------------|-------------|-------|
| Re-attach series | 1,104 | 9 | 1,113 |
| Inline matplotlib script | 6 | 1,148 | 1,154 |
| pip show | 13 | 14 | 27 |
| Final answer to user | 33 | 40 | 73 |
| Run failure (stderr) | 6 | 3 | 9 |
| Fix + re-run stdout | 8 | 3 | 11 |
| **Sum** | **1,170** | **1,217** | **2,387** |

### GMA query+chart lean (auto pts, also_chart)

| Step | In (context) | Out (model) | Total |
|------|----------------|-------------|-------|
| query call | 17 | 32 | 49 |
| query tool result → chart call | 59 | 22 | 81 |
| Final answer to user | 118 | 40 | 158 |
| **Sum** | **194** | **94** | **288** |

### GMA lean + chart include_embed

| Step | In (context) | Out (model) | Total |
|------|----------------|-------------|-------|
| query call | 17 | 32 | 49 |
| query tool result → chart call | 59 | 22 | 81 |
| Final answer to user | 174 | 40 | 214 |
| **Sum** | **250** | **94** | **344** |

### GMA query+chart full (pts=50)

| Step | In (context) | Out (model) | Total |
|------|----------------|-------------|-------|
| query call | 17 | 32 | 49 |
| query tool result → chart call | 663 | 22 | 685 |
| Final answer to user | 722 | 40 | 762 |
| **Sum** | **1,402** | **94** | **1,496** |

## Tool definition overhead

| Bundle | Tools | Schema tokens (tools/list JSON) |
|--------|-------|----------------------------------|
| GraphMyAnything MCP | 5 | **511** |
| Python agent harness (representative) | 6 | **248** |

| Flow | Excl. defs | + defs × turns | + defs once (cached) |
|------|------------|----------------|----------------------|
| Python file E2E cold | 658 | **2,791** | 906 |
| GMA lean | 288 | **1,821** | 799 |

Prompt caching often discounts repeated tool schemas after turn 1; we show both **worst-case (× turns)** and **cached-once**.

## $ cost per 1,000 identical questions

| Flow | Tokens / question | Est. API cost |
|------|-------------------|---------------|
| Python file E2E cold | 658 | $6.00 |
| Python file E2E warm | 713 | $7.78 |
| GMA lean | 288 | $1.66 |
| GMA lean include_embed | 344 | $1.75 |
| GMA full pts=50 | 1,496 | $3.77 |
| Best-case file Python | 167 | $1.65 |

Pricing: [GPT-5.2](https://platform.openai.com/docs/pricing).

## 30-session warm cumulative

| Flow | Per session | × 30 |
|------|-------------|-------------|
| Python file E2E warm | 713 | **21,390** |
| Python inline E2E warm | 2,387 | **71,610** |
| GMA lean | 288 | **8,640** |

## Answer quality (same prompt)

| Flow | Trend | % change | Anomalies w/o extra chat |
|------|-------|----------|---------------------------|
| Python E2E | Printed in stdout | Printed | No (+1 turn typical) |
| GMA query + chart | `summary.trend=up` | `summary.pct_change=14.68` | Use `insight` tool |
| GMA + insight | Yes | Yes | Yes (5 in synthetic run) |

## Caveats

- Modeled flows, not live agent traces; token counts are **reproducible** from step text in `e2e-flows.ts`.
- **Best-case** row is a deliberate lower bound; citing it without E2E is misleading.
- File E2E assumes the agent does not paste the whole JSON into chat when told to read from disk.
- GMA `chart` (hosted): default returns **share URL** only (`https://graphmyanything.com/c/<id>`); set `include_embed: true` for embed URLs/snippets (not image bytes in chat).
- **GMA lean variance:** older pins used **284** (local-only) and **344** (URL + embeds always-on); this run: default **288**, `include_embed` **344** — drift if payload shape changes; re-run `npm run benchmark:tokens` to refresh.
- Other model tokenizers differ slightly; dollar lines scale linearly with token split.
- **Shared** `SHARED_USER_CONTEXT` on turn 1 and `SHARED_FINAL_ANSWER` on the last step for every flow (`e2e-assumptions.ts`).
- Python harness defs are a **representative** Cursor-style 6-tool bundle, not a live session export.

## Reproduce

```bash
cd benchmarks/token-benchmark
npm install
npm run run
```

From repo root: `npm run benchmark:tokens`

![Token benchmark](./token-benchmark.svg)
