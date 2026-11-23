import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const pkgRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const bin = path.join(pkgRoot, "bin/graphmyanything-mcp.js");

function runHelp(args: string[]): { status: number | null; stdout: string } {
  const r = spawnSync(process.execPath, [bin, ...args], {
    encoding: "utf8",
    env: { ...process.env, NODE_OPTIONS: "--disable-warning=ExperimentalWarning" },
  });
  return { status: r.status, stdout: r.stdout ?? "" };
}

describe("CLI --help", () => {
  beforeAll(() => {
    const build = spawnSync("npm", ["run", "build"], {
      cwd: pkgRoot,
      stdio: "inherit",
    });
    if (build.status !== 0) throw new Error("build failed");
  });

  it("graphmyanything-mcp --help exits 0 with usage", () => {
    const { status, stdout } = runHelp(["--help"]);
    expect(status).toBe(0);
    expect(stdout).toMatch(/graphmyanything-mcp/);
    expect(stdout).toMatch(/sync/);
    expect(stdout).toMatch(/GMA_API_KEY/);
    expect(stdout).toMatch(/GRAPHMYANYTHING_API_KEY/);
    expect(stdout).toMatch(/graphmyanything\.com/);
  });

  it("graphmyanything-mcp sync --help exits 0", () => {
    const { status, stdout } = runHelp(["sync", "--help"]);
    expect(status).toBe(0);
    expect(stdout).toMatch(/graphmyanything-mcp sync/);
    expect(stdout).toMatch(/device/);
  });
});