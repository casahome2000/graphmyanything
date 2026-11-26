import { spawn, spawnSync } from "node:child_process";
import { createInterface } from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { mcpSpawnEnv } from "./mcp-spawn-env.js";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const serverJs = path.join(root, "dist/index.js");

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

describe("MCP resources/list", () => {
  beforeAll(() => {
    const build = spawnSync("npm", ["run", "build"], {
      cwd: root,
      stdio: "inherit",
    });
    if (build.status !== 0) throw new Error("build failed");
  });

  it("lists usage-guide and chart-guide with stable URIs", async () => {
    const dbPath = path.join("/tmp", `gma-res-list-${process.pid}.db`);
    const child = spawn(
      process.execPath,
      ["--disable-warning=ExperimentalWarning", serverJs],
      {
        env: mcpSpawnEnv("local", dbPath),
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
    const listed = (await rpc(child, "resources/list", {})) as {
      resources: { name: string; uri: string; mimeType?: string }[];
    };
    const names = (listed.resources ?? []).map((r) => r.name).sort();
    expect(names).toEqual(["chart-guide", "usage-guide"]);

    const usage = listed.resources!.find((r) => r.name === "usage-guide");
    expect(usage?.uri).toBe("graphmyanything://docs/usage-guide");
    expect(usage?.mimeType).toBe("text/markdown");

    const read = (await rpc(child, "resources/read", {
      uri: "graphmyanything://docs/chart-guide",
    })) as { contents: { text: string }[] };
    expect(read.contents[0]?.text).toMatch(/GraphMyAnything chart tool/);

    child.stdin!.end();
    child.kill();
  });
});