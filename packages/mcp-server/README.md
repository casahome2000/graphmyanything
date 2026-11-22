# graphmyanything-mcp

**One call instead of throwaway Python.** Local-first [MCP](https://modelcontextprotocol.io) server that stores metrics in SQLite and returns token-efficient summaries, insights, and charts for AI agents.

[Join the waitlist](https://graphmyanything.com) · Founding member preorder live on the site.

![Sample MRR chart](./docs/sample-chart.svg)

## Install

```bash
npx -y graphmyanything-mcp@0.1.1
```

Requires Node.js **22.13+** (built-in `node:sqlite`, no native compile step). Metrics persist at `~/.graphmyanything/metrics.db` (override with `GRAPHMYANYTHING_DB_PATH`). Charts are written beside the DB (`<db-dir>/charts/`) when the DB path is custom, or override with `GRAPHMYANYTHING_CHARTS_DIR`; default `~/.graphmyanything/charts/`.

**No telemetry** — we do not phone home; install counts come from npm downloads only.

## Tools

| Tool | What it does |
|------|----------------|
| `track` | Record a value, batch, or historical points (`metric`, `value` or `points[]`, optional `tags`) |
| `query` | Summary + LTTB series within `token_budget` (`metric`, `range` like `90d`, `token_budget`) |
| `insight` | Plain-English trend, MAD anomalies, naive forecast |
| `chart` | Writes a dark/light **SVG on disk** (`path`). **`url` is always `null`** in 0.1.1 (no dead `graphmyanything.com/c/…` links). `hosted_url_note` explains that public URLs are not live yet. |

Open the file at `path` in your IDE or browser locally. Hosted live chart URLs on [graphmyanything.com](https://graphmyanything.com) are coming for founding members — the tool does not return a fetchable public URL today.

## Cursor

`.cursor/mcp.json` or **Cursor Settings → MCP**:

```json
{
  "mcpServers": {
    "graphmyanything": {
      "command": "npx",
      "args": ["-y", "graphmyanything-mcp@0.1.1"]
    }
  }
}
```

## Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "graphmyanything": {
      "command": "npx",
      "args": ["-y", "graphmyanything-mcp@0.1.1"]
    }
  }
}
```

## Claude Code

```bash
claude mcp add graphmyanything -- npx -y graphmyanything-mcp@0.1.1
```

## Example session

```
track(metric="stripe.mrr", value=84210, tags={"plan":"pro"})
query(metric="stripe.mrr", range="90d", token_budget=200)
insight(metric="stripe.mrr", range="90d")
chart(metric="stripe.mrr", range="90d", type="area", theme="dark")
→ {"path":"/Users/you/.graphmyanything/charts/stripe.mrr-….svg","url":null,"hosted_url_note":"Hosted live chart URLs are coming soon: graphmyanything.com"}
```

## Develop

```bash
npm install
npm run build
npm test
```

## License

MIT