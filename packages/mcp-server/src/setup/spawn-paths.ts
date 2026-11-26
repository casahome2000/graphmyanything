import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { PACKAGE_VERSION } from "../version.js";

export function resolveNodePath(): string {
  try {
    return fs.realpathSync(process.execPath);
  } catch {
    return process.execPath;
  }
}

export function resolveNpxCliPath(nodePath = resolveNodePath()): string | undefined {
  const dir = path.dirname(nodePath);
  const npx =
    process.platform === "win32"
      ? path.join(dir, "npx.cmd")
      : path.join(dir, "npx");
  if (fs.existsSync(npx)) return npx;
  const which = spawnSync(
    process.platform === "win32" ? "where" : "which",
    ["npx"],
    { encoding: "utf8" },
  );
  if (which.status === 0 && which.stdout?.trim()) {
    const line = which.stdout.trim().split(/\r?\n/)[0]!;
    return line;
  }
  return undefined;
}

/** MCP server spawn for client JSON (absolute paths, pinned version). */
export function buildMcpServerEntry(): {
  command: string;
  args: string[];
} {
  const npx = resolveNpxCliPath();
  const node = resolveNodePath();
  const pin = `graphmyanything-mcp@${PACKAGE_VERSION}`;
  if (npx) {
    return {
      command: npx,
      args: ["-y", pin],
    };
  }
  const npxCliJs = path.join(path.dirname(node), "node_modules", "npm", "bin", "npx-cli.js");
  if (fs.existsSync(npxCliJs)) {
    return { command: node, args: [npxCliJs, "-y", pin] };
  }
  return { command: node, args: ["-y", pin] };
}