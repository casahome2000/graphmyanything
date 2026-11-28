# GraphMyAnything — 5-minute quick start

**<!-- fact:copy.headline -->Build once. Ask forever.<!-- /fact -->** [`graphmyanything-mcp`](https://www.npmjs.com/package/graphmyanything-mcp) is a local MCP server that remembers your metrics in SQLite so the agent can **query**, **insight**, and **chart** from stored history instead of re-fetching or plotting in chat.

**Requires:** Node.js **22.13+** (built-in `node:sqlite`).

## Install the MCP server

**Easiest (recommended):**

```bash
npx graphmyanything-mcp setup
```

Pick your client when prompted (or pass `cursor`, `claude-desktop`, `vscode`, `windsurf`, `claude-code`). This updates the client MCP config with absolute paths and a pinned version, backs up your old file, and can run account sign-in. **`sync` does not install or enable MCP** — it only links your GraphMyAnything account.

Manual install (gets the latest published release):

```bash
npx -y graphmyanything-mcp@latest
```

Optional pin (reproducible):

```bash
npx -y graphmyanything-mcp@<!-- fact:package.version -->0.2.12<!-- /fact -->
```

Clients launch the same command over **stdio** — you do not run `npx` yourself during normal chat; the IDE does.

### Optional: hosted sync (0.2+)

Link the CLI to your GraphMyAnything account and upload existing local history (local DB is kept as backup):

```bash
npx -y graphmyanything-mcp@<!-- fact:package.version -->0.2.12<!-- /fact --> sync
```

You will get a short code to enter at [graphmyanything.com/connect](https://graphmyanything.com/connect). After auth, metrics sync in batches and MCP tools use the hosted API for reads while **writes still mirror to local SQLite**.

**Pricing:** [graphmyanything.com](https://graphmyanything.com) — **Free:** <!-- fact:plans.free.metrics -->3<!-- /fact --> metrics, <!-- fact:plans.free.points fmt:compactK -->10k<!-- /fact --> points, <!-- fact:plans.free.readDays -->90<!-- /fact -->-day reads, <!-- fact:plans.free.shareLinks -->3<!-- /fact --> share links; **Pro:** <!-- fact:plans.founding.thenMonthlyUsd fmt:usd0 -->$9<!-- /fact -->/mo (auto-renews; cancel anytime) for higher limits (<!-- fact:plans.founding.metrics -->50<!-- /fact --> metrics, <!-- fact:plans.founding.points fmt:compact -->1M<!-- /fact --> points, full-history reads, <!-- fact:plans.founding.shareLinks -->100<!-- /fact --> share links).

Other CLI commands:

| Command | Purpose |
|---------|---------|
| `status` | Mode, paths, plan usage when hosted |
| `local` | Prefer local mode (keeps saved API key) |
| `logout` | Remove API key from config |
| `charts` | List recent local SVG chart files |
| `setup` / `install` | Add MCP to your editor (main path) |
| `doctor` | Node version, credentials (masked), API reachability |
| `--version` / `-v` | Print installed package version |

Force local mode in an MCP session: `GRAPHMYANYTHING_MODE=local`. Use `GRAPHMYANYTHING_API_KEY` or `GMA_API_KEY` for CI without writing config.

**Hosted deletes:** `forget` is a permanent delete. In hosted mode it removes data on the server **and** from your local SQLite mirror for the same `metric` / time filter.

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

The image sets `GRAPHMYANYTHING_DB_PATH=/data/metrics.db`. It installs `graphmyanything-mcp` **<!-- fact:package.version -->0.2.12<!-- /fact -->** by default (`GMA_MCP_VERSION` build-arg). Point your MCP host at `docker run -i … graphmyanything-mcp` as the stdio command.

## First prompt

After the server shows up in your client's MCP list, try:

> <!-- fact:copy.starterPrompt -->Using the graphmyanything MCP tools (track, query, insight, forget, chart), backfill the last 14 days of GitHub star counts for modelcontextprotocol/servers into metric github.stars.modelcontextprotocol.servers (use realistic illustrative daily values shaped around the public API), query the 14-day trend, give a one-line insight, then chart it as a dark line chart and return the live share link.<!-- /fact -->

**What you should see**

1. **`track`** — JSON like `{"ok":true,"metric":"github.stars.modelcontextprotocol.servers","written":14,"replaced":0,"tokens_estimate":…}` (upserts on same `metric` + `ts`).
2. **`query`** — terse stats (`s.l`, `s.mn`, `s.tr`, …) and maybe downsampled `pts` depending on budget.
3. **`chart`** — local mode: `path` to an SVG file. After **`sync`**: share `url` like `https://graphmyanything.com/c/<hex-id>` by default; pass `include_embed: true` when you need embed URLs (`…/svg`, `…/png`). Share pages show **hover tooltips** on markers in the browser.

Open the local `path` in your IDE or browser; open the hosted `url` for a shareable page.

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

## Troubleshooting

### MCP host shows `spawn npx ENOENT`

The IDE could not find `npx` on its `PATH` (common right after installing Node, before a client restart).

1. Install **Node.js 22.13+** and confirm `npx -y graphmyanything-mcp@latest --version` works in a terminal.
2. **Restart** the MCP client (Cursor, Claude Desktop, VS Code, etc.) so it picks up your shell `PATH`.
3. If it still fails, point `command` at the absolute `npx` path from `which npx` (keep the same `args`, e.g. `["-y", "graphmyanything-mcp@latest"]`).

### Ran `npx graphmyanything-mcp` in a terminal

That is expected. On a **TTY**, the CLI prints a short install check on **stderr** (version, Node, link to this quickstart) and **exits 0** — it is not waiting for you to type MCP messages. Your **IDE** launches the same command with piped stdio, which keeps the server running. To test stdio manually in a terminal, use `npx graphmyanything-mcp --stdio`.

### Hosted sign-in

Saved keys live in `~/.graphmyanything/credentials.json` (mode `0600`). Legacy `~/.graphmyanything/config.json` is still read. Run `graphmyanything-mcp doctor` to verify Node, credentials (masked), and API reachability.

## Next steps

- [Examples](./examples.md) — copy-paste prompts and tool JSON.
- [Agent guide](./agent-guide.md) — when to keep, store, update, and use metrics.
- [Root README](../README.md) — benchmarks and repo map.
- [n8n Stripe MRR template](../integrations/n8n/README.md) — daily `track → query → insight → chart`.