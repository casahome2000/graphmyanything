# GraphMyAnything — 5-minute quick start

**Build once. Ask forever.** [`graphmyanything-mcp`](https://www.npmjs.com/package/graphmyanything-mcp) is a local MCP server that remembers your metrics in SQLite so the agent can **query**, **insight**, and **chart** from stored history instead of re-fetching or plotting in chat.

**Requires:** Node.js **22.13+** (built-in `node:sqlite`).

## Install the MCP server

Default (gets the latest published release):

```bash
npx -y graphmyanything-mcp@latest
```

Optional pin (reproducible):

```bash
npx -y graphmyanything-mcp@0.1.3
```

Clients launch the same command over **stdio** — you do not run `npx` yourself during normal chat; the IDE does.

### Optional: hosted sync (0.2+)

Link the CLI to your GraphMyAnything account and upload existing local history (local DB is kept as backup):

```bash
npx -y graphmyanything-mcp@0.2.0 sync
```

You will get a short code to enter at [graphmyanything.com/connect](https://graphmyanything.com/connect). After auth, metrics sync in batches and MCP tools use the hosted API for reads while **writes still mirror to local SQLite**.

Other CLI commands:

| Command | Purpose |
|---------|---------|
| `status` | Mode, paths, plan usage when hosted |
| `local` | Prefer local mode (keeps saved API key) |
| `logout` | Remove API key from config |
| `charts` | List recent local SVG chart files |

Force local mode in an MCP session: `GRAPHMYANYTHING_MODE=local`. Use `GRAPHMYANYTHING_API_KEY` for CI without writing config.

### Cursor

`.cursor/mcp.json` or **Settings → MCP → Add server**:

```json
{
  "mcpServers": {
    "graphmyanything": {
      "command": "npx",
      "args": ["-y", "graphmyanything-mcp@latest"]
    }
  }
}
```

### Claude Desktop

`claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/…`, Windows: `%APPDATA%\Claude\…`):

```json
{
  "mcpServers": {
    "graphmyanything": {
      "command": "npx",
      "args": ["-y", "graphmyanything-mcp@latest"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add graphmyanything -- npx -y graphmyanything-mcp@latest
```

### VS Code

**Settings → MCP** (or your team's `mcp.json` alongside the workspace). Same shape as Cursor:

```json
{
  "mcpServers": {
    "graphmyanything": {
      "command": "npx",
      "args": ["-y", "graphmyanything-mcp@latest"]
    }
  }
}
```

### Windsurf

Windsurf MCP config (user or workspace): add the same `command` / `args` pair under `mcpServers.graphmyanything`.

### Docker

Persistent data under `/data`:

```bash
docker build -t graphmyanything-mcp https://github.com/casahome2000/graphmyanything.git
docker run -i --rm -v gma-data:/data graphmyanything-mcp
```

The image sets `GRAPHMYANYTHING_DB_PATH=/data/metrics.db`. Point your MCP host at `docker run -i … graphmyanything-mcp` as the stdio command.

## First prompt

After the server shows up in your client's MCP list, try:

> Track my weight as 182.4 lb in metric `health.weight.lb`, then query the last 7 days and chart it with a dark line chart.

**What you should see**

1. **`track`** — JSON like `{"ok":true,"metric":"health.weight.lb","written":1,"replaced":0,"tokens_estimate":…}` (upserts on same `metric` + `ts`).
2. **`query`** — terse stats (`s.l`, `s.mn`, `s.tr`, …) and maybe downsampled `pts` depending on budget.
3. **`chart`** — `{"path":"…/.graphmyanything/charts/health.weight.lb-….svg","url":null,"hosted_url_note":…}`.

Open the SVG path locally (IDE or browser) for the chart file.

## Where data lives

| What | Default path |
|------|----------------|
| SQLite metrics DB | `~/.graphmyanything/metrics.db` |
| Chart SVGs | `~/.graphmyanything/charts/` |

| Env var | Purpose |
|---------|---------|
| `GRAPHMYANYTHING_DB_PATH` | Custom DB file |
| `GRAPHMYANYTHING_CHARTS_DIR` | Custom chart output directory |

In Docker, defaults are under `/data` (see image `ENV`).

## MCP resources for agents

Without bloating `tools/list`, the server exposes:

- **`chart-guide`** — `graphmyanything://docs/chart-guide` — chart type, theme, labels, range.
- **`usage-guide`** — `graphmyanything://docs/usage-guide` — when to track, forget, query, insight, or chart.

The server's **initialize** response includes a short instruction to read those resources.

## Update to a newer package

1. Change `@latest` or bump the pinned version in your MCP config (or rebuild the Docker `GMA_MCP_VERSION` build-arg).
2. **Restart** the MCP server / reload MCP in the client (`@latest` picks up npm on the next process start).

There is no in-process upgrade; each client spawn runs `npx` again.

## Next steps

- [Examples](./examples.md) — copy-paste prompts and tool JSON.
- [Agent guide](./agent-guide.md) — when to keep, store, update, and use metrics.
- [Root README](../README.md) — benchmarks and repo map.
- [n8n Stripe MRR template](../integrations/n8n/README.md) — daily `track → query → insight → chart`.