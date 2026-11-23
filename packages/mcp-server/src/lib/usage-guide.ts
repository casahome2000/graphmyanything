/** Condensed agent usage guide — MCP resource `usage-guide` (full doc: docs/agent-guide.md). */
export const USAGE_GUIDE_RESOURCE = `# GraphMyAnything — when to keep, store, update, use

**Build once. Ask forever.** Store time series locally; answer later from history in a few hundred tokens.

## Track (store)
- **Do:** numbers you will chart or compare again; anything over time; data that is slow or costly to re-fetch (billing APIs, scraped series).
- **Don't:** one-off constants, secrets, passwords, raw PII you would not store in a local log.
- **Names:** \`namespace.metric.unit\` (e.g. \`health.weight.lb\`, \`stripe.mrr.usd\`). Units belong in the metric string; use \`tags\` for dimensions.
- **Batch once:** use \`points[]\` with \`ts\` (Unix seconds) for backfill; then \`value\` for incremental days.
- **Idempotency:** each \`track\` **inserts** a row. Same \`metric\` + \`ts\` again **adds another row** (no upsert). Queries return all rows ordered by time — prefer distinct timestamps; to fix a mistake, track the corrected value at the intended \`ts\` and know duplicates may appear until manual DB edit.
- **No delete tool** in 0.1.x; retention is indefinite. Clear data by removing the SQLite file (\`~/.graphmyanything/metrics.db\` or \`GRAPHMYANYTHING_DB_PATH\`).

## Query vs insight vs chart
| Need | Tool |
|------|------|
| Stats + optional compact series under a token budget | \`query\` (\`points: 0\` = summary only; \`also_chart: true\` drops pts) |
| Plain English trend, MAD anomalies, naive forecast | \`insight\` |
| SVG file for the user | \`chart\` (read resource **chart-guide** for type/theme/labels) |

## Freshness
- Trust stored data for history and trends within your SLA.
- Re-fetch the source when the user asks for "today"/"live", after a known event (deploy, payout), or when the latest stored point is stale for that metric.

## Token hints
- Prefer \`query\` + \`chart\` over pasting big JSON or matplotlib in chat.
- Use \`token_budget\` and \`points: 0\` or \`also_chart\` to stay lean.
- Responses include \`tokens_estimate\` (chars ÷ 4, approximate).

Read MCP resource **chart-guide** for chart options.
`;

/** Initialize \`instructions\` field (≤60 tokens, chars÷4). */
export const MCP_SERVER_INSTRUCTIONS =
  "Read MCP resources usage-guide and chart-guide before track/query/chart. Store reusable metrics; query stored history instead of re-fetching.";

export function mcpInstructionsTokenEstimate(): number {
  return Math.ceil(MCP_SERVER_INSTRUCTIONS.length / 4);
}