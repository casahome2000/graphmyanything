import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const serverJs = path.join(root, "dist/index.js");
const baselinePath = path.join(
  root,
  "test/fixtures/tools-list-baseline.json",
);

function rpc(
  child: ReturnType<typeof spawn>,
  method: string,
  params: Record<string, unknown> = {},
): Promise<unknown> {
  let id = Math.floor(Math.random() * 1e9);
  return new Promise((resolve, reject) => {
    child.stdin!.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    const rl = createInterface({ input: child.stdout! });
    rl.once("line", (line) => {
      rl.close();
      try {
        const res = JSON.parse(line) as { error?: { message: string }; result: unknown };
        if (res.error) reject(new Error(res.error.message));
        else resolve(res.result);
      } catch (e) {
        reject(e);
      }
    });
  });
}

describe("MCP tools/list", () => {
  it("matches baseline byte-for-byte", async () => {
    const baseline = fs.readFileSync(baselinePath, "utf8");
    const child = spawn(
      process.execPath,
      ["--disable-warning=ExperimentalWarning", serverJs],
      {
        env: {
          ...process.env,
          GRAPHMYANYTHING_DB_PATH: `/tmp/gma-tools-list-${Date.now()}.db`,
        },
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

    const actual = JSON.stringify(tools);
    expect(actual).toBe(baseline.trim());
  });
});