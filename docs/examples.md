# GraphMyAnything — example prompts & tool calls

Each example has a **user prompt**, the **tool call** (arguments matching the **<!-- fact:package.version -->0.2.5<!-- /fact -->** Zod schemas), and a **sample response** shape. Example JSON is validated in CI (`test/example-args.test.ts`).

Tools: `track`, `forget`, `query`, `insight`, `chart`. All successful responses include `tokens_estimate` (JSON length ÷ 4, approximate).

---

## 1. GitHub stars — 14-day backfill (illustrative)

**Prompt:** *Backfill daily star counts for `modelcontextprotocol/servers` into `github.stars.modelcontextprotocol.servers` for the last 14 days — illustrative counts only, not live sync.*

**Tool:** `track`

```json
{
  "metric": "github.stars.modelcontextprotocol.servers",
  "points": [
    { "ts": 1762819200, "value": 90862 },
    { "ts": 1762905600, "value": 90928 },
    { "ts": 1762992000, "value": 90985 },
    { "ts": 1763078400, "value": 91052 },
    { "ts": 1763164800, "value": 91110 },
    { "ts": 1763251200, "value": 91168 },
    { "ts": 1763337600, "value": 91225 },
    { "ts": 1763424000, "value": 91290 },
    { "ts": 1763510400, "value": 91355 },
    { "ts": 1763596800, "value": 91420 },
    { "ts": 1763683200, "value": 91495 },
    { "ts": 1763769600, "value": 91580 },
    { "ts": 1763856000, "value": 91890 },
    { "ts": 1763942400, "value": 92228 }
  ],
  "tags": { "source": "github", "repo": "modelcontextprotocol/servers" }
}
```

`ts` values are Unix **seconds** (UTC). Per-point `tags` merge with top-level `tags`.

**Sample response:**

```json
{
  "ok": true,
  "metric": "github.stars.modelcontextprotocol.servers",
  "written": 14,
  "replaced": 0,
  "tokens_estimate": 48
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

**Prompt:** *In plain English, how have GitHub stars on `modelcontextprotocol/servers` grown over the last 14 days? Flag weird spikes.*

**Tool:** `insight`

```json
{
  "metric": "github.stars.modelcontextprotocol.servers",
  "range": "14d"
}
```

**Sample response (abridged):**

```json
{
  "summary": "Metric \"github.stars.modelcontextprotocol.servers\" (14 points, 14d). Upward trend over 14d: latest 92228, 1.5% vs start. No strong anomalies detected (MAD z-score threshold 3.5). Naive linear forecast (next 3 steps): 92280, 92332, 92384.",
  "trend": "Upward trend over 14d: latest 92228, 1.5% vs start.",
  "anomalies": [],
  "forecast": {
    "horizon": 3,
    "next_values": [92280, 92332, 92384],
    "method": "naive_linear_regression_on_index"
  },
  "stats": { "latest": 92228, "count": 14, "trend": "up", "pct_change": 1.5 },
  "tokens_estimate": 125
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

**Sample response (local mode):**

```json
{
  "path": "/home/you/.graphmyanything/charts/geo.plano_tx.population-2026-11-23T12-00-00.svg",
  "url": null,
  "hosted_url_note": "Local chart only. Run `npx -y graphmyanything-mcp@latest sync` to get live chart links.",
  "tokens_estimate": 48
}
```

---

## 6b. Hosted chart after sync

**Prompt:** *Chart USD MRR for 90 days and give me a shareable link I can paste in Slack.*

Prerequisite: `npx -y graphmyanything-mcp@latest sync` (or `GRAPHMYANYTHING_API_KEY` / `GMA_API_KEY`).

**Tool:** `chart`

```json
{
  "metric": "stripe.mrr.usd",
  "range": "90d",
  "type": "line",
  "theme": "dark",
  "labels": "last",
  "share": true
}
```

**Sample response (hosted, default — lean):**

```json
{
  "path": "/home/you/.graphmyanything/charts/stripe.mrr.usd-2026-11-23T12-00-00.svg",
  "url": "https://graphmyanything.com/c/a1b2c3d4e5f67890",
  "tokens_estimate": 62
}
```

**With embed URLs** (`"include_embed": true` on the tool call):

```json
{
  "path": "/home/you/.graphmyanything/charts/stripe.mrr.usd-2026-11-23T12-00-00.svg",
  "url": "https://graphmyanything.com/c/a1b2c3d4e5f67890",
  "embed_svg": "https://graphmyanything.com/c/a1b2c3d4e5f67890.svg",
  "embed_png": "https://graphmyanything.com/c/a1b2c3d4e5f67890.png",
  "tokens_estimate": 95
}
```

Live share pages include **hover tooltips** on chart markers when opened in a browser. Set `"share": false` to skip the public `url` while still writing the local SVG backup.

---

## 7. Query a time range with a small series

**Prompt:** *Show GitHub stars for `modelcontextprotocol/servers` over the last 14 days — include about a dozen points for context.*

**Tool:** `query`

```json
{
  "metric": "github.stars.modelcontextprotocol.servers",
  "range": "14d",
  "token_budget": 250,
  "points": 12
}
```

**Range grammar:** `7d`, `14d`, `90d`, `12w`, `1y`, `30y`, or `all` (see `parseRange` in the server).

**Sample response:**

```json
{
  "m": "github.stars.modelcontextprotocol.servers",
  "rg": "14d",
  "s": { "l": 92228, "mn": 90862, "mx": 92228, "mu": 91520, "tr": "up", "pct": 1.5, "n": 14 },
  "pts": [
    { "ts": 1763510400, "value": 91355 },
    { "ts": 1763942400, "value": 92228 }
  ],
  "tokens_estimate": 98
}
```

---

## 8. Correct a point (upsert same date)

**Prompt:** *Yesterday's GitHub star snapshot was off — use 91870 at that day's timestamp instead.*

**Tool:** `track`

```json
{
  "metric": "github.stars.modelcontextprotocol.servers",
  "points": [{ "ts": 1763856000, "value": 91870 }],
  "tags": { "note": "corrected API snapshot" }
}
```

**Behavior:** `track` **upserts** on `(metric, ts)`. The same timestamp replaces the previous value; response reports `written` (new ts) vs `replaced` (updated ts).

**Sample response (correction):**

```json
{
  "ok": true,
  "metric": "github.stars.modelcontextprotocol.servers",
  "written": 0,
  "replaced": 1,
  "tokens_estimate": 24
}
```

---

## 9. Delete a point — `forget`

**Prompt:** *Drop only the bad snapshot from last Tuesday — keep the rest of `github.stars.modelcontextprotocol.servers`.*

**Tool:** `forget`

```json
{
  "metric": "github.stars.modelcontextprotocol.servers",
  "ts": 1763769600
}
```

**Other modes:** `from` + `to` (Unix seconds, inclusive); `all: true` with **`confirm: true`** to drop an entire metric. **`metric` is always required.**

**Sample response:**

```json
{
  "ok": true,
  "metric": "github.stars.modelcontextprotocol.servers",
  "deleted": 1,
  "tokens_estimate": 20
}
```

---

## 10. Multiple metrics — naming convention

**Prompt:** *I'm tracking GitHub stars and MRR in dollars — keep namespaces separate.*

| Metric | Meaning |
|--------|---------|
| `github.stars.modelcontextprotocol.servers` | GitHub star count for `modelcontextprotocol/servers` |
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