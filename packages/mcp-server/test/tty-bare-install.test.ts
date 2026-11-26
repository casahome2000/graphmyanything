import { describe, expect, it, vi } from "vitest";
import { QUICKSTART_URL } from "../src/lib/site-urls.js";
import {
  formatNodeCheckLine,
  printTtyBareInstallCheck,
} from "../src/lib/tty-bare-install.js";
import { PACKAGE_VERSION } from "../src/version.js";

describe("printTtyBareInstallCheck", () => {
  it("prints install, node, and quickstart lines to stderr", () => {
    const lines: string[] = [];
    printTtyBareInstallCheck((line) => lines.push(line));
    expect(lines).toHaveLength(4);
    expect(lines[0]).toBe(`graphmyanything-mcp ${PACKAGE_VERSION} installed.`);
    expect(lines[1]).toMatch(/^Node\.js .+: (OK|warning)/);
    expect(lines[2]).toContain("setup");
    expect(lines[3]).toBe(`Manual config: ${QUICKSTART_URL}`);
  });
});

describe("formatNodeCheckLine", () => {
  it("warns below minimum Node", () => {
    expect(formatNodeCheckLine("20.0.0")).toMatch(/warning/);
  });
});