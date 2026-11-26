import { spawn, spawnSync } from "node:child_process";
import { createInterface } from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { mcpSpawnEnv } from "./mcp-spawn-env.js";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const serverJs = path.join(root, "dist/index.js");

const BASELINE_TOKENS = 641;
const MAX_TOKEN_GROWTH = 400;

function rpc(
  child: ReturnType<typeof spawn>,
  method: string,
  params: Record<string, unknown> = {},
): Promise<unknown> {
  const id = Math.floor(Math.random() * 1e9);
  return new Promise((resolve, reject) => {
    child.stdin!.write(
      JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n",
    );
    const rl = createInterface({ input: child.stdout! });
    rl.once("line", (line) => {
      rl.close();
      try {
        const res = JSON.parse(line) as {
          error?: { message: string };
          result: unknown;
        };
        if (res.error) reject(new Error(res.error.message));
        else resolve(res.result);
      } catch (e) {
        reject(e);
      }
    });
  });
}

async function toolsListPayload(mode: "local" | "hosted"): Promise<string> {
  const dbPath = path.join(
    "/tmp",
    `gma-tools-list-${mode}-${process.pid}-${Date.now()}.db`,
  );
  const child = spawn(
    process.execPath,
    ["--disable-warning=ExperimentalWarning", serverJs],
    {
      env: mcpSpawnEnv(mode, dbPath),
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  await rpc(child, "initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "test", version: "0" },
  });
  child.stdin!.write(
    JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) +
      "\n",
  );
  const tools = await rpc(child, "tools/list", {});
  child.stdin!.end();
  child.kill();
  return JSON.stringify(tools);
}

function tokensCharsOver4(payload: string): number {
  return Math.ceil(payload.length / 4);
}

describe("MCP tools/list", () => {
  beforeAll(() => {
    const build = spawnSync("npm", ["run", "build"], {
      cwd: root,
      stdio: "inherit",
    });
    if (build.status !== 0) {
      throw new Error("npm run build failed before tools/list test");
    }
  });

  const cap = BASELINE_TOKENS + MAX_TOKEN_GROWTH;

  it.each(["local", "hosted"] as const)(
    "on-wire payload in %s mode stays within cap",
    async (mode) => {
      const actual = await toolsListPayload(mode);
      const tokens = tokensCharsOver4(actual);
      expect(tokens).toBeLessThanOrEqual(cap);
    },
  );
});