#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { openDatabase } from "./db.js";
import {
  handleChart,
  handleInsight,
  handleQuery,
  handleTrack,
} from "./tools/handlers.js";

const db = openDatabase();

const server = new McpServer({
  name: "graphmyanything",
  version: "0.1.0",
});

server.registerTool(
  "track",
  {
    title: "Track metric",
    description:
      "Record one or many metric points (single value, batch, or historical timestamps). Stored locally in SQLite.",
    inputSchema: {
      metric: z.string().describe("Metric name, e.g. stripe.mrr"),
      value: z.number().optional().describe("Single value to record now"),
      points: z
        .array(
          z.object({
            value: z.number(),
            ts: z.number().optional().describe("Unix timestamp seconds"),
            tags: z.record(z.string()).optional(),
          }),
        )
        .optional()
        .describe("Batch or historical points"),
      tags: z.record(z.string()).optional().describe("Tags applied to all points"),
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
      "Compact summary (latest, min, max, mean, trend, % change) plus LTTB-downsampled series within token_budget.",
    inputSchema: {
      metric: z.string(),
      range: z
        .string()
        .optional()
        .describe("e.g. 7d, 90d, 12w, 1y, or all (default all)"),
      token_budget: z
        .number()
        .optional()
        .describe("Target max tokens for JSON response (default 500)"),
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
      "Plain-English trend, robust anomalies (MAD z-score), and naive linear forecast.",
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
    description:
      "Render a dark-theme SVG chart to a local file and return its path.",
    inputSchema: {
      metric: z.string(),
      range: z.string().optional(),
      type: z.enum(["line", "bar", "area"]).optional(),
      theme: z.enum(["dark", "light"]).optional(),
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