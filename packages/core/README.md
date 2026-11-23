# @graphmyanything/core

Pure TypeScript logic shared by the MCP server and the GraphMyAnything web app. No SQLite, filesystem, or network dependencies.

Copy from a pinned commit in this monorepo, for example:

```bash
git archive <commit> packages/core | tar -x
```

## Modules

| Module | Contents |
|--------|----------|
| `lttb` | Largest-Triangle-Three-Buckets downsampling |
| `summary` | `parseRange`, `computeSummary`, `fitTokenBudget` |
| `terse-summary` | Token-efficient query summaries, `resolveIncludeSeries` |
| `insight` | Trend, MAD anomalies, naive linear forecast |
| `svg-chart` | SVG rendering, axis ticks, label collision avoidance |
| `tokens` | `estimateTokens`, `withTokensEstimate` |
| `query` | Token-budgeted query payload builder |