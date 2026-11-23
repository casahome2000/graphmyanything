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
    description: "Write metric point(s) to local SQLite.",
    inputSchema: {
      metric: z.string(),
      value: z.number().optional(),
      points: z
        .array(
          z.object({
            value: z.number(),
            ts: z.number().optional(),
            tags: z.record(z.string()).optional(),
          }),
        )
        .optional(),
      tags: z.record(z.string()).optional(),
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
    description: "Terse summary (s.l/mn/mx/mu/tr/pct/n) + optional LTTB pts.",
    inputSchema: {
      metric: z.string(),
      range: z.string().optional().describe(RANGE_DESCRIBE),
      token_budget: z.number().optional(),
      points: z.union([z.number().min(0), z.literal("auto")]).optional(),
      also_chart: z.boolean().optional(),
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
    description: "Trend, MAD anomalies, naive forecast.",
    inputSchema: {
      metric: z.string(),
      range: z.string().optional(),
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
      metric: z.string(),
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