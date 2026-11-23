import os from "node:os";
import path from "node:path";
import { resolveDbPath } from "./db.js";

export const HOSTED_CHART_URL_NOTE =
  "Local chart only. Run `npx -y graphmyanything-mcp@latest sync` to get live chart links.";

/** Local SVG output directory (not bundled in npm `files`). */
export function resolveChartsDir(): string {
  const explicit = process.env.GRAPHMYANYTHING_CHARTS_DIR?.trim();
  if (explicit) {
    return path.resolve(explicit);
  }
  if (process.env.GRAPHMYANYTHING_DB_PATH?.trim()) {
    return path.join(path.dirname(path.resolve(resolveDbPath())), "charts");
  }
  return path.join(os.homedir(), ".graphmyanything", "charts");
}