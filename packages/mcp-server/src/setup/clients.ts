import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

export type McpClientId =
  | "cursor"
  | "claude-desktop"
  | "claude-code"
  | "vscode"
  | "windsurf";

export const MCP_CLIENT_LABEL: Record<McpClientId, string> = {
  cursor: "Cursor",
  "claude-desktop": "Claude Desktop",
  "claude-code": "Claude Code",
  vscode: "VS Code",
  windsurf: "Windsurf",
};

export const STARTER_PROMPT =
  "Backfill the last 14 days of GitHub stars for modelcontextprotocol/servers into metric github.stars.modelcontextprotocol.servers (illustrative daily counts), then query 14d and chart with a dark line chart.";

export type ClientTarget =
  | { kind: "json-file"; path: string }
  | { kind: "claude-cli" };

export function clientConfigTarget(id: McpClientId): ClientTarget | undefined {
  const home = os.homedir();
  const plat = process.platform;
  switch (id) {
    case "cursor": {
      const p = path.join(home, ".cursor", "mcp.json");
      return { kind: "json-file", path: p };
    }
    case "windsurf": {
      const candidates = [
        path.join(home, ".codeium", "windsurf", "mcp_config.json"),
        path.join(home, ".windsurf", "mcp.json"),
      ];
      const p = candidates.find((c) => fs.existsSync(path.dirname(c))) ?? candidates[0]!;
      return { kind: "json-file", path: p };
    }
    case "claude-desktop": {
      let p: string;
      if (plat === "darwin") {
        p = path.join(
          home,
          "Library",
          "Application Support",
          "Claude",
          "claude_desktop_config.json",
        );
      } else if (plat === "win32") {
        const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
        p = path.join(appData, "Claude", "claude_desktop_config.json");
      } else {
        p = path.join(home, ".config", "Claude", "claude_desktop_config.json");
      }
      return { kind: "json-file", path: p };
    }
    case "vscode": {
      let p: string;
      if (plat === "darwin") {
        p = path.join(home, "Library", "Application Support", "Code", "User", "mcp.json");
      } else if (plat === "win32") {
        const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
        p = path.join(appData, "Code", "User", "mcp.json");
      } else {
        p = path.join(home, ".config", "Code", "User", "mcp.json");
      }
      return { kind: "json-file", path: p };
    }
    case "claude-code":
      return { kind: "claude-cli" };
    default:
      return undefined;
  }
}

export function clientInstalled(id: McpClientId): boolean {
  const target = clientConfigTarget(id);
  if (!target) return false;
  if (target.kind === "claude-cli") {
    const r = spawnSync("claude", ["--version"], {
      encoding: "utf8",
      timeout: 3000,
    });
    return r.status === 0;
  }
  const dir = path.dirname(target.path);
  if (fs.existsSync(target.path)) return true;
  if (id === "cursor" && fs.existsSync(path.join(os.homedir(), ".cursor"))) return true;
  if (id === "vscode") {
    const codeDir =
      process.platform === "darwin"
        ? path.join(os.homedir(), "Library", "Application Support", "Code")
        : process.platform === "win32"
          ? path.join(process.env.APPDATA || "", "Code")
          : path.join(os.homedir(), ".config", "Code");
    return fs.existsSync(codeDir);
  }
  if (id === "claude-desktop") return fs.existsSync(dir);
  if (id === "windsurf") {
    return fs.existsSync(path.join(os.homedir(), ".codeium")) ||
      fs.existsSync(path.join(os.homedir(), ".windsurf"));
  }
  return fs.existsSync(dir);
}

export function detectInstalledClients(): McpClientId[] {
  const order: McpClientId[] = [
    "cursor",
    "claude-desktop",
    "claude-code",
    "vscode",
    "windsurf",
  ];
  return order.filter((id) => clientInstalled(id));
}

export function parseClientArg(raw: string | undefined): McpClientId | undefined {
  if (!raw) return undefined;
  const n = raw.toLowerCase().replace(/\s+/g, "-");
  const map: Record<string, McpClientId> = {
    cursor: "cursor",
    claude: "claude-desktop",
    "claude-desktop": "claude-desktop",
    "claude-code": "claude-code",
    claudecode: "claude-code",
    code: "vscode",
    vscode: "vscode",
    windsurf: "windsurf",
  };
  return map[n];
}