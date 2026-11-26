/** MCP tools/list payload shape (for benchmarks and registration). */

import { CHART_TOOL_DESCRIPTION, RANGE_DESCRIBE } from "./lib/chart-guide.js";
import { FORGET_TOOL_DESCRIPTION } from "./tool-schemas.js";

export type ToolDef = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export const GMA_TOOL_CATALOG: ToolDef[] = [
  {
    name: "track",
    title: "Track",
    description: "Upsert by metric+ts; written/replaced counts.",
    inputSchema: {
      type: "object",
      properties: {
        metric: { type: "string" },
        value: { type: "number" },
        points: {
          type: "array",
          items: {
            type: "object",
            properties: {
              value: { type: "number" },
              ts: { type: "number" },
              tags: { type: "object" },
            },
            required: ["value"],
          },
        },
        tags: { type: "object" },
      },
      required: ["metric"],
    },
  },
  {
    name: "query",
    title: "Query",
    description: "Summary + optional LTTB series.",
    inputSchema: {
      type: "object",
      properties: {
        metric: { type: "string" },
        range: { type: "string", description: RANGE_DESCRIBE },
        token_budget: { type: "number" },
        points: {
          oneOf: [{ type: "number", minimum: 0 }, { type: "string", enum: ["auto"] }],
        },
        also_chart: { type: "boolean" },
      },
      required: ["metric"],
    },
  },
  {
    name: "insight",
    title: "Insight",
    description: "Trend, anomalies, naive forecast.",
    inputSchema: {
      type: "object",
      properties: {
        metric: { type: "string" },
        range: { type: "string", description: RANGE_DESCRIBE },
      },
      required: ["metric"],
    },
  },
  {
    name: "chart",
    title: "Chart",
    description: CHART_TOOL_DESCRIPTION,
    inputSchema: {
      type: "object",
      properties: {
        metric: { type: "string" },
        range: { type: "string", description: RANGE_DESCRIBE },
        type: { type: "string", enum: ["line", "bar", "area"] },
        theme: { type: "string", enum: ["dark", "light"] },
        labels: { type: "string", enum: ["none", "last", "extremes", "all"] },
        share: { type: "boolean", description: "Hosted share url (default true)." },
        include_embed: { type: "boolean", description: "Hosted embed urls if true." },
      },
      required: ["metric"],
    },
  },
  {
    name: "forget",
    title: "Forget",
    description: FORGET_TOOL_DESCRIPTION,
    inputSchema: {
      type: "object",
      properties: {
        metric: { type: "string" },
        ts: { type: "number" },
        from: { type: "number" },
        to: { type: "number" },
        all: {
          type: "boolean",
          description: "Delete all points for metric; requires confirm:true.",
        },
        confirm: {
          type: "boolean",
          description: "Must be true when all:true.",
        },
      },
      required: ["metric"],
    },
  },
];

export function gmaToolsListJson(): string {
  return JSON.stringify({ tools: GMA_TOOL_CATALOG });
}

export function gmaToolsListTokenEstimate(): number {
  return Math.ceil(gmaToolsListJson().length / 4);
}

export function gmaPerToolTokenEstimates(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const tool of GMA_TOOL_CATALOG) {
    out[tool.name] = Math.ceil(JSON.stringify({ tools: [tool] }).length / 4);
  }
  return out;
}