import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const workflowPath = path.join(
  repoRoot,
  "integrations/n8n/track-stripe-mrr-daily.json",
);

describe("n8n workflow JSON", () => {
  it("imports cleanly and compute node has inlined core", () => {
    const raw = fs.readFileSync(workflowPath, "utf8");
    const wf = JSON.parse(raw) as {
      nodes: { id: string; parameters?: { jsCode?: string } }[];
    };
    expect(wf.nodes.length).toBeGreaterThan(8);
    const compute = wf.nodes.find((n) => n.id === "compute-mrr");
    expect(compute?.parameters?.jsCode).toContain("computeDailyBatchPoints");
    expect(compute?.parameters?.jsCode).not.toContain("require(");
    expect(compute?.parameters?.jsCode).not.toContain("$credentials");
    expect(
      wf.nodes.some((n) => n.id === "gma-track-batch"),
    ).toBe(true);
    expect(
      wf.nodes.some((n) => n.id === "stripe-subscriptions"),
    ).toBe(true);
  });
});