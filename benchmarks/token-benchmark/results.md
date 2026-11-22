# Token benchmark (end-to-end)

## Headline (defensible)

**Best-case file Python (~134 tokens) is ~5× too low.** Measured **end-to-end** file flow (search → locate → schema → script → pip → run → answer): **723** tokens (6.6 turns, 8.9 tool calls).

**vs GMA (`query`+`chart`, n8n ingest):** 772 vs 723 (6.8% more). GMA’s clearest win vs **inline JSON E2E** (772 vs 2,471 (68.8% fewer)).

**30 warm sessions (re-discovery, no script memory):** inline 72,960 · file E2E 17,370 · GMA 23,160 (GMA 68.3% fewer vs inline).

**Optional:** GMA `insight` adds anomalies in one tool (**834** tokens total with query+chart+insight).

**Cost (@ 1,000 questions, GPT-5.2):** file E2E cold **$6.06** vs GMA **$9.97** (input $1.75/1M · output $14/1M).

## Assumptions (transparent)

| Item | Value |
|------|--------|
| User prompt | "Chart my last 90 days of MRR and tell me the trend." |
| Data size | 90 daily MRR points (synthetic) |
| Tokenizer | `js-tiktoken` / `o200k_base` |
| Error+fix retry | 30% of flows; fail+fix steps weighted in totals |
| Warm session | Agent has **no memory** of prior script; re-lists / re-attaches data |
| GMA ingestion | **n8n/cron `track`** — 0 tokens inside question flow |
| Best-case Python | Single code-gen turn only; data path stated, not discovered |
| Cost model | GPT-5.2: $1.75/1M in, $14/1M out |

### E2E step model (Python file cold)

- **Search / API hunt** — codebase_search + rg before knowing export path (2 tool calls)
- **Locate data source** — list_dir + glob for exports/*.json (2 tool calls)
- **Schema / head preview** — read first 3 JSON rows (not full series in chat for file path) (1 tool calls)
- **Write matplotlib script** — ~30 lines, read file on disk, save PNG (0 tool calls)
- **Environment setup** — pip install matplotlib + venv check (2 tool calls)
- **Execute script** — python chart script (1 tool calls)
- **Execute script (failed)** — stderr then fix (1 tool calls, weight 0.3)
- **Error fix + re-run** — Assumed in 30% of cold/warm flows (2 tool calls, weight 0.3)

## End-to-end token totals

| Flow | Input | Output | **Total** | Turns | Tool calls |
|------|-------|--------|-----------|-------|------------|
| Python file E2E (cold start) | 332 | 391 | **723** | 6.6 | 8.9 |
| Python file E2E (warm, re-discovery) | 224 | 355 | **579** | 5.6 | 5.9 |
| Python inline JSON E2E (cold) | 1,241 | 1,230 | **2,471** | 4.6 | 4.9 |
| Python inline JSON E2E (warm) | 1,203 | 1,229 | **2,432** | 4.6 | 3.9 |
| GMA query + chart (n8n ingest) | 68 | 704 | **772** | 3 | 2 |
| GMA query + chart + insight | 86 | 748 | **834** | 4 | 3 |
| Best-case file Python (1 turn) | 56 | 78 | **134** | 1 | 0 |

## $ cost per 1,000 identical questions

| Flow | Tokens / question | Est. API cost |
|------|-------------------|---------------|
| Python file E2E cold | 723 | $6.06 |
| Python file E2E warm | 579 | $5.36 |
| GMA query + chart | 772 | $9.97 |
| Best-case file Python | 134 | $1.19 |

Pricing: [GPT-5.2](https://platform.openai.com/docs/pricing).

## 30-session warm cumulative

| Flow | Per session | × 30 |
|------|-------------|-------------|
| Python file E2E warm | 579 | **17,370** |
| Python inline E2E warm | 2,432 | **72,960** |
| GMA query + chart | 772 | **23,160** |

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
- GMA `chart` returns a path, not image bytes (same as Python PNG on disk).
- Other model tokenizers differ slightly; dollar lines scale linearly with token split.

## Reproduce

```bash
cd benchmarks/token-benchmark
npm install
npm run run
```

From repo root: `npm run benchmark:tokens`

![Token benchmark](./token-benchmark.svg)
