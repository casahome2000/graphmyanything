import { RANGE_DESCRIBE } from "./range.js";

export { RANGE_DESCRIBE } from "./range.js";

/** Full chart option guide — exposed as MCP resource `chart-guide`. */
export const CHART_GUIDE_RESOURCE = `# GraphMyAnything chart tool

## Choosing a chart
- **line** (default): trends over time; use for most metrics.
- **bar**: compare categories or sparse periods; best when n ≤ 120 points.
- **area**: same as line but fills under the curve to emphasize volume/magnitude.

## Options
- **theme**: \`dark\` (default) or \`light\` — match the host UI.
- **labels**: \`last\` (default, clean) — one end value beside the last point; \`none\` — no value labels; \`extremes\` — first/last/min/max when they fit without overlap; \`all\` — every point (small series only).
- **range**: same as query — \`${RANGE_DESCRIBE}\` (default \`all\`).
- **share**: default \`true\` in hosted mode; \`false\` skips the public URL (local \`path\` is still written).

## Output
- **Local mode:** SVG on disk; response includes \`path\`. \`url\` is null.
- **Hosted mode** (after \`sync\` or API key): \`path\` (local backup) plus \`url\` at \`https://graphmyanything.com/c/<hex-id>\` when \`share\` is not false. Set \`include_embed: true\` to add \`embed_svg\` / \`embed_png\` (and related snippets). Share pages support hover tooltips on markers in a browser.
`;

/** tools/list blurb — details live in resource chart-guide. */
export const CHART_TOOL_DESCRIPTION = "Render SVG; read chart-guide.";

export const CHART_TYPE_DESCRIBE = "line|bar|area";

export const CHART_THEME_DESCRIBE = "dark|light";

export const CHART_LABELS_DESCRIBE = "none|last|extremes|all";