import { createInterface } from "node:readline";
import { spawnSync } from "node:child_process";
import { linkDeviceAndSync } from "../cli/sync-auth.js";
import {
  MCP_CLIENT_LABEL,
  STARTER_PROMPT,
  clientConfigTarget,
  detectInstalledClients,
  parseClientArg,
  type McpClientId,
} from "./clients.js";
import { buildMcpServerEntry } from "./spawn-paths.js";
import { mergeGraphmyanythingServer } from "./merge-config.js";

function ask(
  question: string,
  defaultYes = true,
): Promise<boolean> {
  if (!process.stdin.isTTY) return Promise.resolve(defaultYes);
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stderr });
    const hint = defaultYes ? "[Y/n]" : "[y/N]";
    rl.question(`${question} ${hint} `, (ans) => {
      rl.close();
      const a = ans.trim().toLowerCase();
      if (!a) resolve(defaultYes);
      else resolve(a === "y" || a === "yes");
    });
  });
}

function pickClientInteractive(candidates: McpClientId[]): Promise<McpClientId> {
  return new Promise((resolve, reject) => {
    const rl = createInterface({ input: process.stdin, output: process.stderr });
    console.error("Multiple MCP clients detected:");
    candidates.forEach((c, i) => {
      console.error(`  ${i + 1}) ${MCP_CLIENT_LABEL[c]}`);
    });
    rl.question("Choose a client (number): ", (ans) => {
      rl.close();
      const n = Number.parseInt(ans.trim(), 10);
      if (n >= 1 && n <= candidates.length) resolve(candidates[n - 1]!);
      else reject(new Error("Invalid choice"));
    });
  });
}

function applyClaudeCode(entry: { command: string; args: string[] }): boolean {
  const args = [entry.command, ...entry.args];
  const r = spawnSync(
    "claude",
    ["mcp", "add", "graphmyanything", "--", ...args],
    { encoding: "utf8", stdio: "inherit" },
  );
  return r.status === 0;
}

export type SetupOptions = {
  clientArg?: string;
  yes?: boolean;
  skipSync?: boolean;
};

export async function runSetup(opts: SetupOptions = {}): Promise<number> {
  const entry = buildMcpServerEntry();
  console.error(
    `MCP command: ${entry.command} ${entry.args.join(" ")}`,
  );

  let client = parseClientArg(opts.clientArg);
  const detected = detectInstalledClients();
  if (!client) {
    if (detected.length === 0) {
      console.error(
        "No supported MCP client detected. Install Cursor, Claude Desktop, Claude Code, VS Code, or Windsurf, then run setup again.",
      );
      return 1;
    }
    if (detected.length === 1) client = detected[0]!;
    else if (opts.yes) client = detected[0]!;
    else client = await pickClientInteractive(detected);
  }

  const target = clientConfigTarget(client);
  if (!target) {
    console.error(`Unknown client: ${client}`);
    return 1;
  }

  if (target.kind === "claude-cli") {
    if (!applyClaudeCode(entry)) {
      console.error("claude mcp add failed. Is Claude Code installed?");
      return 1;
    }
    console.error(`Updated Claude Code MCP registry for graphmyanything.`);
  } else {
    mergeGraphmyanythingServer(target.path, entry);
    console.error(`Wrote ${target.path} (backup created if file existed).`);
  }

  let signedIn = false;
  if (!opts.skipSync) {
    const doSync = opts.yes ? true : await ask("Link your GraphMyAnything account now?", true);
    if (doSync) {
      const code = await linkDeviceAndSync();
      signedIn = code === 0;
      if (!signedIn) console.error("Sign-in incomplete — run `graphmyanything-mcp sync` later.");
    }
  }

  const label = MCP_CLIENT_LABEL[client];
  const settingsHint =
    client === "cursor" || client === "vscode" || client === "windsurf"
      ? `${label} (or toggle graphmyanything on in Settings > MCP)`
      : client === "claude-desktop"
        ? `${label} (restart after config change)`
        : `${label}`;
  console.error(
    `Restart ${settingsHint}, then paste this prompt:`,
  );
  console.error(STARTER_PROMPT);

  return 0;
}