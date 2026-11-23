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

/** Short blurb in tools/list (keeps session token cost down). */
export const CHART_TOOL_DESCRIPTION =
  "Render SVG chart to a local file (path; url null until hosted). line=trends (default); bar=sparse compare (n≤120); area=filled trend. theme dark|light. labels last (default, clean)|none|extremes|all — prefer last. See MCP resource chart-guide for full choosing guide.";

export const RANGE_DESCRIBE =
  "Time window: 7d, 90d, 12w, 1y, or all (default all). Same syntax as query/insight.";

export const CHART_TYPE_DESCRIBE =
  "line: trends over time (default). bar: compare sparse periods/categories (≤120 pts). area: emphasize volume under a trend.";

export const CHART_THEME_DESCRIBE =
  "dark: default, for dark UIs. light: light backgrounds and docs.";

export const CHART_LABELS_DESCRIBE =
  "last (default): single end value beside last point, no clutter. none: axis only. extremes: first/last/min/max when non-overlapping. all: label every point (small n).";