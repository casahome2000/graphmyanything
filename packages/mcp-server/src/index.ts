#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
import "./bootstrap.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { openDatabase } from "./db.js";
import { CHART_GUIDE_RESOURCE, CHART_TOOL_DESCRIPTION } from "./lib/chart-guide.js";
import {
  MCP_SERVER_INSTRUCTIONS,
  USAGE_GUIDE_RESOURCE,
} from "./lib/usage-guide.js";
import {
  chartToolInputSchema,
  insightToolInputSchema,
  queryToolInputSchema,
  trackToolInputSchema,
} from "./tool-schemas.js";
import {
  handleChart,
  handleInsight,
  handleQuery,
  handleTrack,
} from "./tools/handlers.js";

const db = openDatabase();

const PACKAGE_VERSION = "0.1.4";

const server = new McpServer(
  {
    name: "graphmyanything",
    version: PACKAGE_VERSION,
  },
  { instructions: MCP_SERVER_INSTRUCTIONS },
);

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

server.registerResource(
  "usage-guide",
  "graphmyanything://docs/usage-guide",
  {
    mimeType: "text/markdown",
    description:
      "When to track, query, insight, or chart — naming, idempotency, freshness, token hints",
  },
  async () => ({
    contents: [
      {
        uri: "graphmyanything://docs/usage-guide",
        mimeType: "text/markdown",
        text: USAGE_GUIDE_RESOURCE,
      },
    ],
  }),
);

server.registerTool(
  "track",
  {
    title: "Track metric",
    description: "Write metric point(s) to local SQLite.",
    inputSchema: trackToolInputSchema,
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
    inputSchema: queryToolInputSchema,
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
    inputSchema: insightToolInputSchema,
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
    inputSchema: chartToolInputSchema,
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