import { AGENT_MCP_GUARDRAIL } from "./agent-guardrail.js";

/** Condensed agent usage guide — MCP resource `usage-guide` (full doc: docs/agent-guide.md). */
export const USAGE_GUIDE_RESOURCE = `# GraphMyAnything — when to keep, store, update, use

**Build once. Ask forever.** Store time series locally; answer later from history in a few hundred tokens.

**Agents:** ${AGENT_MCP_GUARDRAIL}

## Track (store / upsert)
- **Do:** numbers you will chart or compare again; anything over time; costly-to-fetch data.
- **Don't:** one-off constants, secrets, raw PII you would not store in a local log.
- **Names:** \`namespace.metric.unit\` (e.g. \`github.stars.modelcontextprotocol.servers\`). Use \`tags\` for dimensions.
- **Upsert:** \`track\` replaces an existing row with the same **metric + ts\` (returns \`written\` / \`replaced\`). Re-track at the same timestamp to correct a value.
- **Backfill:** \`points[]\` with \`ts\`; then single \`value\` for incremental days.

## Forget (hard delete)
- **Always require \`metric\`.** Modes: \`ts\` (one point), \`from\`+\`to\` (inclusive range), or \`all:true\` + \`confirm:true\` (whole metric).
- Deletes are permanent. In **hosted** mode, \`forget\` removes data on the server and from local SQLite for the same filter.

## Hosted mode
- Enable with \`graphmyanything-mcp sync\`, config API key, or \`GRAPHMYANYTHING_API_KEY\` / \`GMA_API_KEY\`.
- Reads use the hosted API (subject to plan **read_window_days** on Free: 90-day query/chart window; full history stored).
- Writes mirror to local SQLite. \`chart\` can return share links: \`graphmyanything.com/c/<hex-id>\`.

## Query vs insight vs chart
| Need | Tool |
|------|------|
| Stats + optional series under budget | \`query\` (\`range\`: \`7d\`, \`14d\`, \`30d\`, \`90d\`, \`1y\`, \`all\`; \`points: 0\`; \`also_chart\` drops pts) |
| Plain English trend, anomalies, forecast | \`insight\` (same \`range\` values) |
| SVG for the user | \`chart\` (resource **chart-guide**) |

## Token hints
- \`query\` + \`chart\` beat big JSON in chat; responses include \`tokens_estimate\` (chars÷4).

Read **chart-guide** for chart options.
`;

/** Initialize \`instructions\` field (≤60 tokens, chars÷4). */
export const MCP_SERVER_INSTRUCTIONS =
  "resources/read graphmyanything://docs/usage-guide and graphmyanything://docs/chart-guide before track/query/chart. Store metrics; query history.";

export function mcpInstructionsTokenEstimate(): number {
  return Math.ceil(MCP_SERVER_INSTRUCTIONS.length / 4);
}