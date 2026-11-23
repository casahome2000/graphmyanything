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
      nodes: {
        id: string;
        type: string;
        executeOnce?: boolean;
        parameters?: {
          jsCode?: string;
          url?: string;
          headerParameters?: { parameters: { name: string; value: string }[] };
        };
      }[];
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

  it("runs on stock n8n: no MCP tool nodes, Stripe lists fetched once, API version pinned", () => {
    const wf = JSON.parse(fs.readFileSync(workflowPath, "utf8")) as {
      nodes: {
        id: string;
        name: string;
        type: string;
        executeOnce?: boolean;
        parameters?: {
          url?: string;
          headerParameters?: { parameters: { name: string; value: string }[] };
        };
      }[];
    };
    // MCP tool sub-nodes in the main flow fail n8n's pre-run check ("SSE Endpoint is required").
    expect(wf.nodes.some((n) => n.type.includes("mcpClient"))).toBe(false);
    expect(wf.nodes.some((n) => n.type === "n8n-nodes-base.manualTrigger")).toBe(true);
    const stripe = wf.nodes.filter((n) => n.parameters?.url?.includes("api.stripe.com"));
    expect(stripe).toHaveLength(4);
    for (const n of stripe) {
      expect(
        n.parameters?.headerParameters?.parameters.find((h) => h.name === "Stripe-Version")?.value,
      ).toBe("2024-11-20.acacia");
      // Without Execute Once, each node re-runs per page of the previous node and duplicates revenue.
      if (n.name !== "Stripe subscriptions") expect(n.executeOnce).toBe(true);
    }
  });
});