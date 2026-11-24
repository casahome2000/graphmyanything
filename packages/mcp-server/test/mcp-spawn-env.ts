/** Minimal, deterministic env for stdio MCP integration tests. */

const GMA_KEYS = [
  "GRAPHMYANYTHING_API_KEY",
  "GMA_API_KEY",
  "GRAPHMYANYTHING_MODE",
  "GRAPHMYANYTHING_CONFIG_PATH",
  "GRAPHMYANYTHING_API_BASE",
  "GRAPHMYANYTHING_DB_PATH",
] as const;

export function mcpSpawnEnv(
  mode: "local" | "hosted",
  dbPath: string,
): NodeJS.ProcessEnv {
  const base: NodeJS.ProcessEnv = {
    PATH: process.env.PATH ?? "",
    HOME: process.env.HOME ?? "/tmp",
    NODE_OPTIONS: "--disable-warning=ExperimentalWarning",
    GRAPHMYANYTHING_DB_PATH: dbPath,
  };
  if (mode === "local") {
    base.GRAPHMYANYTHING_MODE = "local";
    for (const key of GMA_KEYS) {
      if (key !== "GRAPHMYANYTHING_DB_PATH" && key !== "GRAPHMYANYTHING_MODE") {
        delete base[key];
      }
    }
    return base;
  }
  base.GRAPHMYANYTHING_API_KEY = "gma_test_tools_list";
  base.GRAPHMYANYTHING_API_BASE = "http://127.0.0.1:9";
  delete base.GRAPHMYANYTHING_MODE;
  delete base.GRAPHMYANYTHING_CONFIG_PATH;
  return base;
}