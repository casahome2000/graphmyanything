import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MCP_TTY_STARTUP_MESSAGE,
  maybePrintMcpTtyHint,
} from "../src/lib/stdio-hint.js";

describe("maybePrintMcpTtyHint", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints one stderr line when stdin is a TTY", () => {
    maybePrintMcpTtyHint(true);
    expect(console.error).toHaveBeenCalledOnce();
    expect(console.error).toHaveBeenCalledWith(MCP_TTY_STARTUP_MESSAGE);
    expect(MCP_TTY_STARTUP_MESSAGE).toContain("graphmyanything.com/docs");
  });

  it("is silent when stdin is piped", () => {
    maybePrintMcpTtyHint(false);
    expect(console.error).not.toHaveBeenCalled();
  });
});