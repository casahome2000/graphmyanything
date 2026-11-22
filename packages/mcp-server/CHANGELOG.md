# Changelog

## 0.1.2 — 2026-11-22

### chart

- X-axis date/time ticks with span-aware formatting (years, month/day, intraday times), baseline axis line, and extra padding so labels do not clip.
- Circle markers on each point when \(n \le 60\) (thinned above that), with SVG `<title>` tooltips for exact timestamp and value.
- Value labels on first, last, min, and max; all points labeled when \(n \le 12\).

### query / tools

- Fix `tokens_estimate` on `query` (was always `0` because the field was set after `JSON.stringify`).
- Every tool response (`track`, `query`, `insight`, `chart`) now includes `tokens_estimate` (chars ÷ 4, documented as an estimate).