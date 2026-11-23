#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
import "./bootstrap.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { openDatabase } from "./db.js";
import {
  CHART_GUIDE_RESOURCE,
  CHART_LABELS_DESCRIBE,
  CHART_THEME_DESCRIBE,
  CHART_TOOL_DESCRIPTION,
  CHART_TYPE_DESCRIBE,
  RANGE_DESCRIBE,
} from "./lib/chart-guide.js";
import {
  handleChart,
  handleInsight,
  handleQuery,
  handleTrack,
} from "./tools/handlers.js";

const db = openDatabase();

const server = new McpServer({
  name: "graphmyanything",
  version: "0.1.3",
});

server.registerResource(
  "chart-guide",
  "graphmyanything://docs/chart-guide",
  {
    mimeType: "text/markdown",
    description: "When to pick line/bar/area, theme, labels, and range for the chart tool",
  },
  async () => ({
    contents: [
      {
        uri: "graphmyanything://docs/chart-guide",
        mimeType: "text/markdown",
        text: CHART_GUIDE_RESOURCE,
      },
    ],
  }),
);

server.registerTool(
  "track",
  {
    title: "Track metric",
    description:
      "Write metric point(s) to local SQLite. Use value for a single point now, or points[] for batch/history.",
    inputSchema: {
      metric: z
        .string()
        .describe("Metric name, dotted namespace e.g. stripe.mrr"),
      value: z
        .number()
        .optional()
        .describe("Single value recorded at now (unless points[] set)"),
      points: z
        .array(
          z.object({
            value: z.number(),
            ts: z.number().optional().describe("Unix timestamp seconds"),
            tags: z.record(z.string()).optional(),
          }),
        )
        .optional()
        .describe(
          "Batch or historical points with optional per-point ts and tags",
        ),
      tags: z
        .record(z.string())
        .optional()
        .describe("Tags merged into every point in this call"),
    },
  },
  async (args) => {
    const result = handleTrack(db, args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.registerTool(
  "query",
  {
    title: "Query metric",
    description:
      "Terse summary keys s.l/mn/mx/mu/tr/pct/n plus optional LTTB pts[]. Use before chart when you need numbers, not pixels.",
    inputSchema: {
      metric: z.string().describe("Metric name to read"),
      range: z.string().optional().describe(RANGE_DESCRIBE),
      token_budget: z
        .number()
        .optional()
        .describe(
          "Target max tokens for JSON body (default 500); may shrink pts",
        ),
      points: z
        .union([z.number().min(0), z.literal("auto")])
        .optional()
        .describe(
          "Series detail: auto (default), 0=summary only, or N>0 for LTTB N points",
        ),
      also_chart: z
        .boolean()
        .optional()
        .describe(
          "Set true when chart follows — auto mode omits pts to save tokens",
        ),
    },
  },
  async (args) => {
    const result = handleQuery(db, args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.registerTool(
  "insight",
  {
    title: "Metric insight",
    description:
      "Trend direction, MAD outliers, naive forecast. Use after query when the user wants interpretation, not a chart.",
    inputSchema: {
      metric: z.string().describe("Metric name to analyze"),
      range: z.string().optional().describe(RANGE_DESCRIBE),
    },
  },
  async (args) => {
    const result = handleInsight(db, args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

server.registerTool(
  "chart",
  {
    title: "Render chart",
    description: CHART_TOOL_DESCRIPTION,
    inputSchema: {
      metric: z.string().describe("Metric name to render"),
      range: z.string().optional().describe(RANGE_DESCRIBE),
      type: z
        .enum(["line", "bar", "area"])
        .optional()
        .describe(CHART_TYPE_DESCRIBE),
      theme: z
        .enum(["dark", "light"])
        .optional()
        .describe(CHART_THEME_DESCRIBE),
      labels: z
        .enum(["none", "last", "extremes", "all"])
        .optional()
        .describe(CHART_LABELS_DESCRIBE),
    },
  },
  async (args) => {
    const result = handleChart(db, args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});