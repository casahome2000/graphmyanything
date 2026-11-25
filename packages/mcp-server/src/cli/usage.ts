const SITE = "https://graphmyanything.com";
const CONNECT = `${SITE}/connect`;

export function isHelpFlag(arg: string | undefined): boolean {
  if (!arg) return false;
  return arg === "--help" || arg === "-h";
}

export function isVersionFlag(arg: string | undefined): boolean {
  if (!arg) return false;
  return arg === "--version" || arg === "-v";
}

const ENV_BLOCK = `Environment:
  GRAPHMYANYTHING_API_KEY   Hosted API key (Bearer). Alias: GMA_API_KEY
  GMA_API_KEY               Same as GRAPHMYANYTHING_API_KEY
  GRAPHMYANYTHING_API_BASE  API base (default ${SITE}/api/v1)
  GRAPHMYANYTHING_MODE      Set to "local" to force local MCP tools
  GRAPHMYANYTHING_DB_PATH   SQLite metrics DB (default ~/.graphmyanything/metrics.db)
  GRAPHMYANYTHING_CONFIG_PATH  Credentials JSON (default ~/.graphmyanything/credentials.json)
  GRAPHMYANYTHING_CHARTS_DIR   Chart SVG output directory`;

export function printRootHelp(): void {
  const text = `graphmyanything-mcp — Metric memory MCP server (stdio) or CLI

Usage:
  graphmyanything-mcp                 Start MCP server on stdio (default)
  graphmyanything-mcp sync            Link device + upload local SQLite to hosted
  graphmyanything-mcp status          Mode, paths, and hosted account summary
  graphmyanything-mcp local           Force local-only mode in config
  graphmyanything-mcp logout          Clear saved API key
  graphmyanything-mcp charts          List recent chart SVG paths
  graphmyanything-mcp doctor          Node, credentials, and hosted API checks

  graphmyanything-mcp --help
  graphmyanything-mcp -v, --version   Print package version
  graphmyanything-mcp --self-test     Same checks as doctor
  graphmyanything-mcp <command> --help

${ENV_BLOCK}

Hosted sign-in: ${CONNECT} (device code flow via sync)

Examples:
  npx graphmyanything-mcp --help
  npx graphmyanything-mcp sync
  GMA_API_KEY=gma_… npx graphmyanything-mcp status
  npx -y graphmyanything-mcp@latest
`;
  process.stdout.write(text);
}

const COMMAND_HELP: Record<string, string> = {
  sync: `graphmyanything-mcp sync — Link account and upload local metrics

Uploads points from your local SQLite DB to your hosted GraphMyAnything account.
If no API key is saved, opens device authorization at ${CONNECT}.

Usage:
  graphmyanything-mcp sync [--help]

${ENV_BLOCK}

Examples:
  graphmyanything-mcp sync
  GRAPHMYANYTHING_API_KEY=gma_… graphmyanything-mcp sync
`,

  status: `graphmyanything-mcp status — Show configuration and usage

Prints local vs hosted mode, config paths, and hosted plan/usage when signed in.

Usage:
  graphmyanything-mcp status [--help]

${ENV_BLOCK}
`,

  local: `graphmyanything-mcp local — Force local-only MCP mode

Writes mode=local to config so MCP tools use SQLite only (ignores hosted key).

Usage:
  graphmyanything-mcp local [--help]
`,

  logout: `graphmyanything-mcp logout — Clear saved hosted API key

Removes the API key from config; does not delete local metrics.

Usage:
  graphmyanything-mcp logout [--help]
`,

  charts: `graphmyanything-mcp charts — List recent chart SVG files

Usage:
  graphmyanything-mcp charts [--help]

${ENV_BLOCK}
`,

  doctor: `graphmyanything-mcp doctor — Preflight for local install

Checks Node.js version, whether an API key is saved (masked), and hosted API reachability.

Usage:
  graphmyanything-mcp doctor [--help]
  graphmyanything-mcp --self-test

${ENV_BLOCK}
`,
};

export function printCommandHelp(command: string): void {
  const text = COMMAND_HELP[command];
  if (text) process.stdout.write(text);
  else printRootHelp();
}