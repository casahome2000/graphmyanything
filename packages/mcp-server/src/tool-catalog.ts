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
    description:
      "Write metric point(s) to local SQLite. Use value for a single point now, or points[] for batch/history.",
    inputSchema: {
      type: "object",
      properties: {
        metric: {
          type: "string",
          description: "Metric name, dotted namespace e.g. stripe.mrr",
        },
        value: {
          type: "number",
          description: "Single value recorded at now (unless points[] set)",
        },
        points: {
          type: "array",
          description: "Batch or historical points with optional per-point ts (unix sec) and tags",
          items: {
            type: "object",
            properties: {
              value: { type: "number" },
              ts: { type: "number", description: "Unix timestamp seconds" },
              tags: { type: "object", additionalProperties: { type: "string" } },
            },
            required: ["value"],
          },
        },
        tags: {
          type: "object",
          additionalProperties: { type: "string" },
          description: "Tags merged into every point in this call",
        },
      },
      required: ["metric"],
    },
  },
  {
    name: "query",
    title: "Query metric",
    description:
      "Terse summary keys s.l/mn/mx/mu/tr/pct/n plus optional LTTB pts[]. Use before chart when you need numbers, not pixels.",
    inputSchema: {
      type: "object",
      properties: {
        metric: {
          type: "string",
          description: "Metric name to read",
        },
        range: {
          type: "string",
          description: RANGE_DESCRIBE,
        },
        token_budget: {
          type: "number",
          description: "Target max tokens for JSON body (default 500); may shrink pts",
        },
        points: {
          description: "Series detail: omit with auto (default), 0=summary only, or N>0 for LTTB N points",
          oneOf: [{ type: "number", minimum: 0 }, { type: "string", enum: ["auto"] }],
        },
        also_chart: {
          type: "boolean",
          description: "Set true when chart follows — auto mode omits pts to save tokens",
        },
      },
      required: ["metric"],
    },
  },
  {
    name: "insight",
    title: "Metric insight",
    description:
      "Trend direction, MAD outliers, naive forecast. Use after query when the user wants interpretation, not a chart.",
    inputSchema: {
      type: "object",
      properties: {
        metric: { type: "string", description: "Metric name to analyze" },
        range: { type: "string", description: RANGE_DESCRIBE },
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
        metric: { type: "string", description: "Metric name to render" },
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