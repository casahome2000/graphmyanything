import fs from "node:fs";
import path from "node:path";

export type McpServerEntry = {
  command: string;
  args: string[];
};

export function backupConfigFile(configPath: string): string | undefined {
  if (!fs.existsSync(configPath)) return undefined;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const bak = `${configPath}.bak-${stamp}`;
  fs.copyFileSync(configPath, bak);
  return bak;
}

export function mergeGraphmyanythingServer(
  configPath: string,
  entry: McpServerEntry,
): Record<string, unknown> {
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  let root: Record<string, unknown> = {};
  if (fs.existsSync(configPath)) {
    backupConfigFile(configPath);
    try {
      root = JSON.parse(fs.readFileSync(configPath, "utf8")) as Record<
        string,
        unknown
      >;
    } catch {
      root = {};
    }
  }
  const servers =
    typeof root.mcpServers === "object" && root.mcpServers !== null
      ? { ...(root.mcpServers as Record<string, unknown>) }
      : {};
  servers.graphmyanything = { command: entry.command, args: [...entry.args] };
  root.mcpServers = servers;
  fs.writeFileSync(configPath, `${JSON.stringify(root, null, 2)}\n`, "utf8");
  return root;
}