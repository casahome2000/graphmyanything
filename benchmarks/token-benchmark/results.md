# Token benchmark: throwaway Python vs GraphMyAnything

**Prompt:** "Chart my last 90 days of MRR and tell me the trend."

**Tokenizer:** `js-tiktoken` with `o200k_base` (same family as recent OpenAI models).

## Assumptions

- **Python path:** User message + full daily MRR JSON in context, assistant emits matplotlib code and prose; output length includes a **1.15× retry/follow-up factor** (fix labels, date axis).
- **GMA path:** One `query` + one `chart` tool round: compact JSON summary + LTTB ~50 points; chart tool returns **file path only** (SVG not inlined in tokens).
- Synthetic MRR series; point counts 90 / 365 / 5000 simulate window size, not always "90 days" at 5k pts.

## Results

| Points | Python in | Python out | Python **total** | GMA in | GMA out | GMA **total** | **Reduction** |
|--------|-----------|------------|------------------|--------|---------|---------------|---------------|
| 90 | 1,140 | 1,242 | **2,382** | 67 | 751 | **818** | **65.7%** |
| 365 | 4,440 | 4,542 | **8,982** | 67 | 751 | **818** | **90.9%** |
| 5000 | 60,061 | 60,162 | **120,223** | 67 | 751 | **818** | **99.3%** |

### Headline (90 daily points)

At **90** points: **2,382** tokens (throwaway Python) vs **818** tokens (query + chart) → **65.7%** fewer tokens.

![Bar chart](./token-benchmark.svg)

```bash
npm run run   # from benchmarks/token-benchmark
```
