# Changelog

## 0.2.8 — 2026-11-26

- **`range`:** query, insight, and chart document `7d|14d|30d|90d|1y|all` in tool schemas and MCP guides (parser already accepted them).
- **`forget`:** whole-metric delete error explains `all:true` requires `confirm:true`.
- **MCP resources:** initialize instructions name `graphmyanything://docs/usage-guide` and `chart-guide` for `resources/read`.

## 0.2.7 — 2026-11-25

- **Starter prompt:** canonical first-prompt text for `setup` output, quickstart, and `facts.json` (`copy.starterPrompt`).
- **`doctor`:** one line for API key storage (OS keychain, credentials file path, or not signed in) — never the secret.

## 0.2.6 — 2026-11-25

- **TTY bare run:** `graphmyanything-mcp` on a terminal prints install/version/Node check and quickstart link on **stderr**, then **exits 0** (no hung stdio wait). MCP clients still use piped stdio; **`--stdio`** forces server mode on a TTY for manual testing.
- **`setup` / `install`:** detects MCP clients, merges pinned absolute-path server config (backup first), optional sign-in, starter prompt.
- **OS keychain** for API keys on macOS/Linux (`0600` file fallback elsewhere). **Windows** stays file-only until keychain read is safe.
- **Sync** prints `Connected as email` when the device-token response includes `account_email`.
- **Agent guardrail** on tools, usage-guide, `llms.txt`, and package README (never read credentials files).
- Docs: **`sync`** is sign-in only; **`setup`** is the main install path.

## 0.2.5 — 2026-11-25

- **TTY stdio hint:** when the MCP server starts on a TTY, one stderr line points at [docs](https://graphmyanything.com/docs) (stdout stays clean for MCP framing).
- **CLI:** `--version` / `-v`, **`doctor`** and **`--self-test`** (Node 22.13+, masked credentials check, hosted API reachability).
- **Credentials:** default file `~/.graphmyanything/credentials.json` (0600, `_warning` field); still reads legacy `config.json`.
- **Secrets:** API keys are redacted in CLI errors (last 4 only in doctor output).
- **Docs:** troubleshooting for `spawn npx ENOENT`.

## 0.2.4 — 2026-11-24

- Docs-only: npm README sample chart and built-in **usage-guide** use the GitHub stars example (`github.stars.modelcontextprotocol.servers`) instead of `health.weight.lb`.

## 0.2.3 — 2026-11-23

- **server.json** / **package.json** descriptions shortened for MCP registry (≤100 chars).
- **`chart` `include_embed`** (default `false`): hosted responses return share `url` only; embed fields when opted in (client-side trim).
- Doc pins, Docker **0.2.3**, and benchmark refresh for lean default chart payloads.

## 0.2.2 — 2026-11-23

- **`--help`** / **`sync --help`** no longer create an empty default SQLite file (lazy MCP server load).
- Updated MCP resources **chart-guide** and **usage-guide** for hosted share links and plan limits.

## 0.2.1 — 2026-11-23

- CLI **`--help`** and **`<command> --help`** print usage (commands, flags, env vars, examples) and exit 0.
- **`GMA_API_KEY`** env alias for **`GRAPHMYANYTHING_API_KEY`**.
- Core logic is copied into `dist/vendor/core` at build time; published package has **no** `@graphmyanything/core` dependency (fixes bun/pnpm registry resolution).

## 0.2.0 — 2026-11-23

- **Hosted mode** via `sync` (device code), `status`, `local`, `logout`, `charts` CLI commands.
- Hosted MCP tools use REST API; writes mirror to local SQLite; local DB kept.
- Chart tool: `share` param; hosted `url`, `embed_svg`, `embed_png`.
- See [docs/hosted-api.md](../../docs/hosted-api.md).

## 0.1.4 — 2026-11-23

### track

- **Upsert** on `(metric, ts)` with `UNIQUE` index; legacy DBs dedupe duplicates on open (keeps latest `id`).
- Response includes **`written`** and **`replaced`** counts.

### forget

- New **`forget`** tool: delete by `ts`, `from`+`to` (Unix seconds), or `all:true` with required `confirm:true`. Always requires `metric`. Returns `deleted`.

### docs

- Repo guides: [quickstart](../../docs/quickstart.md), [examples](../../docs/examples.md), [agent-guide](../../docs/agent-guide.md) — updated for upsert/forget.

### MCP discovery

- New MCP resource **`usage-guide`** (`graphmyanything://docs/usage-guide`) — condensed when-to-track/query/chart guidance for agents.
- **`initialize` `instructions`** (≤60 tokens) — points agents at `usage-guide` and `chart-guide`.
- Fifth tool **`forget`** added to `tools/list` (compact schema vs extending `track`).

## 0.1.3 — 2026-11-23

### chart

- Default value labels: **labels: last** — one end-value beside the last point; no labels stacked on markers by default.
- New **labels** option: `none` | `last` (default) | `extremes` | `all` with bounding-box collision avoidance vs markers and other labels.
- Extra Y-axis headroom so peaks do not crowd the title; wider right padding for end labels.
- Tooltips use span-aware dates (e.g. `1996 — 192.6k`) instead of raw ISO UTC strings.

### MCP discovery

- Richer enum descriptions on `chart`, `query`, and `insight` tools; short chart blurb in tools/list plus **chart-guide** MCP resource for the full choosing guide.

### docs

- Install docs primary: `npx -y graphmyanything-mcp@latest` with optional pin to `0.1.3`.

## 0.1.2 — 2026-11-22

### chart

- X-axis date/time ticks with span-aware formatting (years, month/day, intraday times), baseline axis line, and extra padding so labels do not clip.
- Circle markers on each point when \(n \le 60\) (thinned above that), with SVG `<title>` tooltips for exact timestamp and value.
- Value labels on first, last, min, and max; all points labeled when \(n \le 12\).

### query / tools

- Fix `tokens_estimate` on `query` (was always `0` because the field was set after `JSON.stringify`).
- Every tool response (`track`, `query`, `insight`, `chart`) now includes `tokens_estimate` (chars ÷ 4, documented as an estimate).