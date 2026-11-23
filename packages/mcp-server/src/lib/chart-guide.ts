/** Full chart option guide — exposed as MCP resource `chart-guide`. */
export const CHART_GUIDE_RESOURCE = `# GraphMyAnything chart tool

## Choosing a chart
- **line** (default): trends over time; use for most metrics.
- **bar**: compare categories or sparse periods; best when n ≤ 120 points.
- **area**: same as line but fills under the curve to emphasize volume/magnitude.

## Options
- **theme**: \`dark\` (default) or \`light\` — match the host UI.
- **labels**: \`last\` (default, clean) — one end value beside the last point; \`none\` — no value labels; \`extremes\` — first/last/min/max when they fit without overlap; \`all\` — every point (small series only).
- **range**: same as query — \`7d\`, \`90d\`, \`12w\`, \`1y\`, \`all\` (default).
- Prefer **labels: last** and **line** for agent-facing visuals unless the user asks for bars or full annotations.

## Output
SVG written to local disk; response \`path\` opens the file. \`url\` is null until hosted charts ship.
`;

/** tools/list blurb — details live in resource chart-guide. */
export const CHART_TOOL_DESCRIPTION =
  "SVG chart to local path. See MCP resource chart-guide for type, theme, labels.";

export const RANGE_DESCRIBE = "7d|90d|1y|all";

export const CHART_TYPE_DESCRIBE = "line=trends; bar=sparse≤120; area=fill";

export const CHART_THEME_DESCRIBE = "dark|light UI";

export const CHART_LABELS_DESCRIBE =
  "last=clean default; extremes=peaks; all≤12; none=sparkline";