# GraphMyAnything — example prompts & tool calls

Each example has a **user prompt**, the **tool call** (arguments matching the 0.1.3+ Zod schemas), and a **sample response** shape. Example JSON is validated in CI (`test/example-args.test.ts`).

Tools: `track`, `forget`, `query`, `insight`, `chart`. All successful responses include `tokens_estimate` (JSON length ÷ 4, approximate).

---

## 1. Daily metric — body weight

**Prompt:** *Log my weight today: 182.4 pounds. Use metric `health.weight.lb`.*

**Tool:** `track`

```json
{
  "metric": "health.weight.lb",
  "value": 182.4,
  "tags": { "source": "scale" }
}
```

**Sample response:**

```json
{
  "ok": true,
  "metric": "health.weight.lb",
  "written": 1,
  "replaced": 0,
  "tokens_estimate": 20
}
```

---

## 2. Backfill once — Plano, TX population (public series)

**Prompt:** *Backfill Plano population from census into `geo.plano_tx.population` for 2000, 2010, and 2020 — I'll ask about it later without searching again.*

**Tool:** `track`

```json
{
  "metric": "geo.plano_tx.population",
  "points": [
    { "ts": 946684800, "value": 188614 },
    { "ts": 1262304000, "value": 259841 },
    { "ts": 1577836800, "value": 285494 }
  ],
  "tags": { "source": "census" }
}
```

`ts` values are Unix **seconds** (UTC). Per-point `tags` merge with top-level `tags`.

**Sample response:**

```json
{
  "ok": true,
  "metric": "geo.plano_tx.population",
  "written": 3,
  "replaced": 0,
  "tokens_estimate": 24
}
```

---

## 3. Recall stored history — query without re-research

**Prompt:** *What's the population trend for Plano — use the metric we already stored, summary only.*

**Tool:** `query`

```json
{
  "metric": "geo.plano_tx.population",
  "range": "all",
  "token_budget": 200,
  "points": 0
}
```

**Sample response:**

```json
{
  "m": "geo.plano_tx.population",
  "rg": "all",
  "s": {
    "l": 285494,
    "mn": 188614,
    "mx": 285494,
    "mu": 244649.67,
    "tr": "up",
    "pct": 51.33,
    "n": 3
  },
  "tokens_estimate": 45
}
```

---

## 4. Stripe MRR — n8n daily template

**Prompt:** *After today's Stripe run, record MRR 84210 USD like the n8n workflow, then prep a lean 90-day read before charting.*

**Tool (track):**

```json
{
  "metric": "stripe.mrr.usd",
  "value": 84210,
  "tags": { "plan": "mixed", "source": "n8n" }
}
```

**Tool (query before chart):**

```json
{
  "metric": "stripe.mrr.usd",
  "range": "90d",
  "token_budget": 300,
  "also_chart": true,
  "points": "auto"
}
```

With `also_chart: true`, `points: auto` omits `pts` so the following `chart` call carries the visual.

**Sample `query` response:**

```json
{
  "m": "stripe.mrr.usd",
  "rg": "90d",
  "s": { "l": 84210, "mn": 80100, "mx": 84210, "mu": 82105, "tr": "up", "pct": 4.2, "n": 90 },
  "tokens_estimate": 52
}
```

Import the workflow: [`integrations/n8n/track-stripe-mrr-daily.json`](../integrations/n8n/track-stripe-mrr-daily.json).

---

## 5. Insight on a trend

**Prompt:** *In plain English, how has my weight moved over the last 90 days? Flag weird spikes.*

**Tool:** `insight`

```json
{
  "metric": "health.weight.lb",
  "range": "90d"
}
```

**Sample response (abridged):**

```json
{
  "summary": "Metric \"health.weight.lb\" (42 points, 90d). Upward trend over 90d: latest 182.4, 2.1% vs start. No strong anomalies detected (MAD z-score threshold 3.5). Naive linear forecast (next 3 steps): 182.1, 181.9, 181.7.",
  "trend": "Upward trend over 90d: latest 182.4, 2.1% vs start.",
  "anomalies": [],
  "forecast": {
    "horizon": 3,
    "next_values": [182.1, 181.9, 181.7],
    "method": "naive_linear_regression_on_index"
  },
  "stats": { "latest": 182.4, "count": 42, "trend": "up", "pct_change": 2.1 },
  "tokens_estimate": 120
}
```

Use **`insight`** when the user wants narrative + anomalies + forecast, not raw numbers.

---

## 6. Chart type, theme, and labels

**Prompt:** *Chart Plano population over 30 years as a dark area chart and label the peaks.*

**Tool:** `chart`

```json
{
  "metric": "geo.plano_tx.population",
  "range": "30y",
  "type": "area",
  "theme": "dark",
  "labels": "extremes"
}
```

**`labels`:** `none` | `last` (default) | `extremes` | `all`. See MCP resource **`chart-guide`**.

**Sample response:**

```json
{
  "path": "/home/you/.graphmyanything/charts/geo.plano_tx.population-2026-11-23T12-00-00.svg",
  "url": null,
  "hosted_url_note": "Hosted live chart URLs are coming soon: graphmyanything.com",
  "tokens_estimate": 48
}
```

---

## 7. Query a time range with a small series

**Prompt:** *Show my weight for the last week — include about a dozen points for context.*

**Tool:** `query`

```json
{
  "metric": "health.weight.lb",
  "range": "7d",
  "token_budget": 250,
  "points": 12
}
```

**Range grammar:** `7d`, `90d`, `12w`, `1y`, `30y`, or `all` (see `parseRange` in the server).

**Sample response:**

```json
{
  "m": "health.weight.lb",
  "rg": "7d",
  "s": { "l": 182.4, "mn": 181.2, "mx": 183.1, "mu": 182.0, "tr": "flat", "pct": 0.3, "n": 7 },
  "pts": [
    { "ts": 1731888000, "value": 182.0 },
    { "ts": 1732147200, "value": 182.4 }
  ],
  "tokens_estimate": 95
}
```

---

## 8. Correct a point (upsert same date)

**Prompt:** *Yesterday's weigh-in was wrong — it should be 181.9 lb at that day's timestamp.*

**Tool:** `track`

```json
{
  "metric": "health.weight.lb",
  "points": [{ "ts": 1732147200, "value": 181.9 }],
  "tags": { "note": "corrected misread" }
}
```

**Behavior:** `track` **upserts** on `(metric, ts)`. The same timestamp replaces the previous value; response reports `written` (new ts) vs `replaced` (updated ts).

**Sample response (correction):**

```json
{
  "ok": true,
  "metric": "health.weight.lb",
  "written": 0,
  "replaced": 1,
  "tokens_estimate": 22
}
```

---

## 9. Delete a point — `forget`

**Prompt:** *Remove the erroneous weigh-in from last Tuesday only — keep the rest of `health.weight.lb`.*

**Tool:** `forget`

```json
{
  "metric": "health.weight.lb",
  "ts": 1731888000
}
```

**Other modes:** `from` + `to` (Unix seconds, inclusive); `all: true` with **`confirm: true`** to drop an entire metric. **`metric` is always required.**

**Sample response:**

```json
{
  "ok": true,
  "metric": "health.weight.lb",
  "deleted": 1,
  "tokens_estimate": 18
}
```

---

## 10. Multiple metrics — naming convention

**Prompt:** *I'm tracking weight in pounds and MRR in dollars — keep namespaces separate.*

| Metric | Meaning |
|--------|---------|
| `health.weight.lb` | Body weight, pounds |
| `stripe.mrr.usd` | Monthly recurring revenue, USD |
| `geo.plano_tx.population` | City population, count |

Pattern: **`namespace.subject.unit`** (unit optional when obvious). Use **`tags`** for source, plan, or cohort — not for the numeric unit.

**Tool (`chart` on MRR):**

```json
{
  "metric": "stripe.mrr.usd",
  "range": "90d",
  "type": "line",
  "theme": "light",
  "labels": "last"
}
```

---

## Related docs

- [Quick start](./quickstart.md)
- [Agent guide](./agent-guide.md)
- MCP resources: `usage-guide`, `chart-guide`