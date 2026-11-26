import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { STARTER_PROMPT } from "../src/lib/starter-prompt.js";

const CANONICAL =
  "Using the graphmyanything MCP tools (track, query, insight, forget, chart), backfill the last 14 days of GitHub star counts for modelcontextprotocol/servers into metric github.stars.modelcontextprotocol.servers (use realistic illustrative daily values shaped around the public API), query the 14-day trend, give a one-line insight, then chart it as a dark line chart and return the live share link.";

describe("STARTER_PROMPT", () => {
  it("matches the canonical setup / quickstart string", () => {
    expect(STARTER_PROMPT).toBe(CANONICAL);
  });

  it("matches facts copy.starterPrompt", () => {
    const root = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "..",
      "..",
    );
    const facts = JSON.parse(
      fs.readFileSync(path.join(root, "facts/facts.json"), "utf8"),
    ) as { copy?: { starterPrompt?: string } };
    expect(facts.copy?.starterPrompt).toBe(STARTER_PROMPT);
  });
});