import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { hasStdioFlag, shouldStartMcpServer } from "../src/lib/entry-routing.js";
import { QUICKSTART_URL } from "../src/lib/site-urls.js";
import { mcpSpawnEnv } from "./mcp-spawn-env.js";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const serverJs = path.join(root, "dist/index.js");

describe("shouldStartMcpServer", () => {
  it("starts on piped stdin", () => {
    expect(shouldStartMcpServer(false, false, false)).toBe(true);
  });
  it("exits check on TTY without --stdio", () => {
    expect(shouldStartMcpServer(true, false, false)).toBe(false);
  });
  it("starts on TTY with --stdio", () => {
    expect(shouldStartMcpServer(true, true, false)).toBe(true);
  });
  it("skips server when CLI handled", () => {
    expect(shouldStartMcpServer(false, false, true)).toBe(false);
  });
});

describe("hasStdioFlag", () => {
  it("detects --stdio in argv", () => {
    expect(hasStdioFlag(["node", "graphmyanything-mcp", "--stdio"])).toBe(true);
    expect(hasStdioFlag(["node", "graphmyanything-mcp"])).toBe(false);
  });
});

describe("entry spawn", () => {
  beforeAll(() => {
    const build = spawnSync("npm", ["run", "build"], {
      cwd: root,
      stdio: "inherit",
    });
    if (build.status !== 0) throw new Error("build failed");
  });

  let child: ReturnType<typeof spawn> | undefined;

  afterEach(() => {
    child?.kill("SIGTERM");
    child = undefined;
  });

  it("piped stdin starts MCP (responds to initialize)", async () => {
    child = spawn(process.execPath, [serverJs], {
      env: mcpSpawnEnv(),
      stdio: ["pipe", "pipe", "pipe"],
    });
    const init = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test", version: "0" },
      },
    });
    child.stdin!.write(init + "\n");
    const line = await new Promise<string>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("timeout")), 8000);
      child!.stdout!.once("data", (buf) => {
        clearTimeout(t);
        resolve(String(buf));
      });
    });
    expect(line).toContain("graphmyanything");
  }, 15_000);

  it("TTY bare run prints check and exits 0", () => {
    const out = path.join(os.tmpdir(), `gma-tty-${Date.now()}.txt`);
    const r = spawnSync("script", ["-q", "-c", `${process.execPath} ${serverJs}`, out], {
      encoding: "utf8",
      env: mcpSpawnEnv(),
    });
    if (r.error && (r.error as NodeJS.ErrnoException).code === "ENOENT") {
      return; // no `script` on this host; unit tests cover message content
    }
    expect(r.status).toBe(0);
    const err = fs.readFileSync(out, "utf8");
    expect(err).toContain("installed.");
    expect(err).toContain(QUICKSTART_URL);
    expect(err).toContain("to your AI client");
    try {
      fs.unlinkSync(out);
    } catch {
      /* ok */
    }
  });

  it("--stdio on piped stdin still starts MCP", async () => {
    child = spawn(process.execPath, [serverJs, "--stdio"], {
      env: mcpSpawnEnv(),
      stdio: ["pipe", "pipe", "pipe"],
    });
    child.stdin!.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "0" },
        },
      }) + "\n",
    );
    const line = await new Promise<string>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("timeout")), 8000);
      child!.stdout!.once("data", (buf) => {
        clearTimeout(t);
        resolve(String(buf));
      });
    });
    expect(line).toContain('"result"');
  }, 15_000);
});