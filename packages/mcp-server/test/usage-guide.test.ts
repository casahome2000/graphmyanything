import { describe, expect, it } from "vitest";
import {
  MCP_SERVER_INSTRUCTIONS,
  mcpInstructionsTokenEstimate,
} from "../src/lib/usage-guide.js";

describe("MCP initialize instructions", () => {
  it("stays at or under 60 tokens (chars÷4)", () => {
    expect(mcpInstructionsTokenEstimate()).toBeLessThanOrEqual(60);
    expect(MCP_SERVER_INSTRUCTIONS.length).toBeGreaterThan(20);
  });

  it("mentions usage-guide and chart-guide", () => {
    expect(MCP_SERVER_INSTRUCTIONS).toMatch(/usage-guide/);
    expect(MCP_SERVER_INSTRUCTIONS).toMatch(/chart-guide/);
    expect(MCP_SERVER_INSTRUCTIONS).toMatch(/resources\/read/);
    expect(MCP_SERVER_INSTRUCTIONS).toMatch(
      /graphmyanything:\/\/docs\/usage-guide/,
    );
  });
});