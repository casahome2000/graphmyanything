# GraphMyAnything hosted API (v1)

Contract for the GraphMyAnything web app. Base URL: `https://graphmyanything.com/api/v1`.

All authenticated routes use `Authorization: Bearer <api_key>`. Never log or echo API keys in client output. The MCP CLI accepts **`GRAPHMYANYTHING_API_KEY`** or the alias **`GMA_API_KEY`**.

## Device authorization (no API key)

### `POST /device/start`

Starts the device code flow.

**Response 200**

```json
{
  "device_code": "string",
  "user_code": "ABCD-1234",
  "verification_uri": "https://graphmyanything.com/connect",
  "interval": 5,
  "expires_in": 900
}
```

### `POST /device/token`

**Body**

```json
{ "device_code": "string" }
```

**Responses**

```json
200 { "ok": true, "access_token": "gma_...", "token_type": "Bearer" }
428 { "error": "authorization_pending" }
400 { "error": "expired_token" }
400 { "error": "invalid_grant" }
```

The key is returned once; later polls answer `authorization_pending` or `invalid_grant`.

## Account

### `GET /account`

**Response 200**

```json
{
  "ok": true,
  "plan": "free",
  "limits": {
    "metrics": <!-- fact:plans.free.metrics -->3<!-- /fact -->,
    "points": <!-- fact:plans.free.points -->10000<!-- /fact -->,
    "read_window_days": <!-- fact:plans.free.readDays -->90<!-- /fact -->,
    "live_links": <!-- fact:plans.free.shareLinks -->3<!-- /fact -->,
    "chart_wordmark": true
  },
  "usage": { "points": 42, "metrics": 3 }
}
```

**Founding** plans use higher limits (<!-- fact:plans.founding.metrics -->50<!-- /fact --> metrics, <!-- fact:plans.founding.points fmt:int -->1,000,000<!-- /fact --> points, full-history `read_window_days`, <!-- fact:plans.founding.shareLinks -->100<!-- /fact --> live links). Billing at [graphmyanything.com](https://graphmyanything.com): **Free** as above; **Founding** <!-- fact:plans.founding.priceUsd fmt:usd -->$49.00<!-- /fact --> for the first <!-- fact:plans.founding.termMonths -->12<!-- /fact --> months, then <!-- fact:plans.founding.thenMonthlyUsd fmt:usd -->$9.00<!-- /fact -->/mo (auto-renews; cancel anytime).

## Metrics

### `POST /track`

Same body as MCP `track` tool args.

**Response 200**

```json
{ "ok": true, "metric": "stripe.mrr", "written": 1, "replaced": 0 }
```

### `POST /track/batch`

Idempotent upsert on `(metric, ts)`.

**Body**

```json
{
  "points": [
    {
      "metric": "stripe.mrr",
      "ts": 1732147200,
      "value": 84210,
      "tags": {}
    }
  ]
}
```

Max **1000** points per request.

**Response 200**

```json
{ "written": 10, "replaced": 2 }
```

### `POST /forget`

Same body as MCP `forget` tool args. **Hard delete** — matching rows are removed permanently on the server. The MCP server also deletes the same points from local SQLite when in hosted mode.

**Response 200**

```json
{ "ok": true, "metric": "stripe.mrr", "deleted": 1 }
```

### `GET /query`

Query params: `metric` (required), `range`, `token_budget`, `points` (`auto` or integer), `also_chart` (boolean).

**Response 200** — same shape as local MCP `query` (includes `m`, `rg`, `s`, optional `pts`, `tokens_estimate`). Subject to plan **`read_window_days`** on Free.

### `GET /insight`

Query params: `metric` (required), `range`.

**Response 200** — same shape as local MCP `insight`.

### `GET /chart`

Query params: `metric` (required), `range`, `type`, `theme`, `labels`, `share` (boolean, default `true`).

**Response 200**

```json
{
  "url": "https://graphmyanything.com/c/a1b2c3d4e5f67890",
  "embed_svg": "https://graphmyanything.com/c/a1b2c3d4e5f67890.svg",
  "embed_png": "https://graphmyanything.com/c/a1b2c3d4e5f67890.png",
  "path": "/home/you/.graphmyanything/charts/stripe.mrr-….svg",
  "tokens_estimate": 120
}
```

The MCP server returns **share `url` by default**. Set tool arg `include_embed: true` to pass through `embed_svg`, `embed_png`, and related embed fields (client-side trim; API unchanged).

Share URL shapes (public `<hex-id>`):

| URL | Purpose |
|-----|---------|
| `https://graphmyanything.com/c/<hex-id>` | Interactive chart page (hover tooltips on markers) |
| `…/c/<hex-id>.svg` | Raw SVG embed |
| `…/c/<hex-id>.png` | PNG embed |
| `…/c/<hex-id>/svg` | SVG route alias |
| `…/c/<hex-id>/png` | PNG route alias |
| `…/c/<hex-id>/opengraph-image` | Social preview image |

When `share=false`, omit `url` (or return `null`).

## Errors

```json
{ "error": "human-readable message" }
```

HTTP 401 when the API key is missing or invalid; 429 when plan limits are exceeded.