import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildMcpServerEntry,
  resolveNodePath,
} from "../src/setup/spawn-paths.js";
import { PACKAGE_VERSION } from "../src/version.js";

describe("buildMcpServerEntry", () => {
  it("uses absolute command path and pinned package version", () => {
    const entry = buildMcpServerEntry();
    expect(path.isAbsolute(entry.command)).toBe(true);
    expect(entry.args.join(" ")).toContain(`graphmyanything-mcp@${PACKAGE_VERSION}`);
  });

  it("node path is absolute", () => {
    expect(path.isAbsolute(resolveNodePath())).toBe(true);
  });
});