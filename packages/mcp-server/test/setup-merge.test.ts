import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  mergeGraphmyanythingServer,
  type McpServerEntry,
} from "../src/setup/merge-config.js";

describe("mergeGraphmyanythingServer", () => {
  let tmp: string;

  afterEach(() => {
    if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("merges without clobbering other servers", () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gma-merge-"));
    const configPath = path.join(tmp, "mcp.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          mcpServers: {
            other: { command: "echo", args: ["hello"] },
          },
        },
        null,
        2,
      ),
    );
    const entry: McpServerEntry = {
      command: "/usr/bin/npx",
      args: ["-y", "graphmyanything-mcp@0.2.5"],
    };
    mergeGraphmyanythingServer(configPath, entry);
    const out = JSON.parse(fs.readFileSync(configPath, "utf8")) as {
      mcpServers: Record<string, McpServerEntry>;
    };
    expect(out.mcpServers.other.command).toBe("echo");
    expect(out.mcpServers.graphmyanything).toEqual(entry);
    expect(fs.readdirSync(tmp).some((f) => f.includes(".bak-"))).toBe(true);
  });
});