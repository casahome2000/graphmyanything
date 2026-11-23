/** MCP tools/list payload shape (for benchmarks and registration). */

import {
  CHART_LABELS_DESCRIBE,
  CHART_THEME_DESCRIBE,
  CHART_TOOL_DESCRIPTION,
  CHART_TYPE_DESCRIBE,
  RANGE_DESCRIBE,
} from "./lib/chart-guide.js";

export type ToolDef = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export const GMA_TOOL_CATALOG: ToolDef[] = [
  {
    name: "track",
    title: "Track metric",
    description: "Write metric point(s) to local SQLite.",
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
    title: "Query metric",
    description: "Terse summary (s.l/mn/mx/mu/tr/pct/n) + optional LTTB pts.",
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
    title: "Metric insight",
    description: "Trend, MAD anomalies, naive forecast.",
    inputSchema: {
      type: "object",
      properties: {
        metric: { type: "string" },
        range: { type: "string" },
      },
      required: ["metric"],
    },
  },
  {
    name: "chart",
    title: "Render chart",
    description: CHART_TOOL_DESCRIPTION,
    inputSchema: {
      type: "object",
      properties: {
        metric: { type: "string" },
        range: { type: "string", description: RANGE_DESCRIBE },
        type: {
          type: "string",
          enum: ["line", "bar", "area"],
          description: CHART_TYPE_DESCRIBE,
        },
        theme: {
          type: "string",
          enum: ["dark", "light"],
          description: CHART_THEME_DESCRIBE,
        },
        labels: {
          type: "string",
          enum: ["none", "last", "extremes", "all"],
          description: CHART_LABELS_DESCRIBE,
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