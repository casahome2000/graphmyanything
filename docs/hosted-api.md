# GraphMyAnything hosted API (v1)

Contract for the GraphMyAnything web app. Base URL: `https://graphmyanything.com/api/v1`.

All authenticated routes use `Authorization: Bearer <api_key>`. Never log or echo API keys in client output.

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

**Response 200** (one of)

```json
{ "status": "pending" }
{ "status": "slow_down" }
{ "status": "expired" }
{ "status": "authorized", "api_key": "gma_..." }
```

## Account

### `GET /account`

**Response 200**

```json
{
  "plan": "free",
  "limits": { "max_points": 100000, "max_metrics": 500 },
  "usage": { "points": 42, "metrics": 3 }
}
```

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

Same body as MCP `forget` tool args.

**Response 200**

```json
{ "ok": true, "metric": "stripe.mrr", "deleted": 1 }
```

### `GET /query`

Query params: `metric` (required), `range`, `token_budget`, `points` (`auto` or integer), `also_chart` (boolean).

**Response 200** — same shape as local MCP `query` (includes `m`, `rg`, `s`, optional `pts`, `tokens_estimate`).

### `GET /insight`

Query params: `metric` (required), `range`.

**Response 200** — same shape as local MCP `insight`.

### `GET /chart`

Query params: `metric` (required), `range`, `type`, `theme`, `labels`, `share` (boolean, default `true`).

**Response 200**

```json
{
  "url": "https://graphmyanything.com/c/ch_abc123",
  "embed_svg": "<svg ...>",
  "embed_png": "base64...",
  "path": null,
  "tokens_estimate": 120
}
```

When `share=false`, omit `url` (or return `null`).

## Errors

```json
{ "error": "human-readable message" }
```

HTTP 401 when the API key is missing or invalid; 429 when plan limits are exceeded.