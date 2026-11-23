# Changelog

## 0.1.4 — 2026-11-23

### docs

- Repo guides: [quickstart](../../docs/quickstart.md), [examples](../../docs/examples.md), [agent-guide](../../docs/agent-guide.md).

### MCP discovery

- New MCP resource **`usage-guide`** (`graphmyanything://docs/usage-guide`) — condensed when-to-track/query/chart guidance for agents.
- **`initialize` `instructions`** (≤60 tokens) — points agents at `usage-guide` and `chart-guide`.
- `tools/list` payload unchanged; tests validate documented example tool arguments against Zod schemas.

## 0.1.3 — 2026-11-23

### chart

- Default value labels: **labels: last** — one end-value beside the last point; no labels stacked on markers by default.
- New **labels** option: `none` | `last` (default) | `extremes` | `all` with bounding-box collision avoidance vs markers and other labels.
- Extra Y-axis headroom so peaks do not crowd the title; wider right padding for end labels.
- Tooltips use span-aware dates (e.g. `1996 — 192.6k`) instead of raw ISO UTC strings.

### MCP discovery

- Richer enum descriptions on `chart`, `query`, and `insight` tools; short chart blurb in tools/list plus **chart-guide** MCP resource for the full choosing guide.

### docs

- Install docs primary: `npx -y graphmyanything-mcp@latest` with optional pin to `0.1.3`.

## 0.1.2 — 2026-11-22

### chart

- X-axis date/time ticks with span-aware formatting (years, month/day, intraday times), baseline axis line, and extra padding so labels do not clip.
- Circle markers on each point when \(n \le 60\) (thinned above that), with SVG `<title>` tooltips for exact timestamp and value.
- Value labels on first, last, min, and max; all points labeled when \(n \le 12\).

### query / tools

- Fix `tokens_estimate` on `query` (was always `0` because the field was set after `JSON.stringify`).
- Every tool response (`track`, `query`, `insight`, `chart`) now includes `tokens_estimate` (chars ÷ 4, documented as an estimate).