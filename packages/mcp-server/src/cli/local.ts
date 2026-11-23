import { writeConfig, readConfig } from "../config.js";

export function runLocal(): number {
  const hadKey = Boolean(readConfig().api_key);
  writeConfig({ mode: "local" });
  console.log(
    hadKey
      ? "Switched to local mode (API key kept in config; set GRAPHMYANYTHING_MODE=local to force)."
      : "Local mode.",
  );
  return 0;
}