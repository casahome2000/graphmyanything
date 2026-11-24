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
  forgetToolInputSchema,
  FORGET_TOOL_DESCRIPTION,
  insightToolInputSchema,
  queryToolInputSchema,
  trackToolInputSchema,
} from "./tool-schemas.js";
import { readConfig } from "./config.js";
import { resolveApiKey, resolveMode } from "./mode.js";
import { HostedClient } from "./hosted/client.js";
import {
  runChart,
  runForget,
  runInsight,
  runQuery,
  runTrack,
  type ToolRuntime,
} from "./tools/runtime.js";

const PACKAGE_VERSION = "0.2.3";

export async function startMcpServer(): Promise<void> {
  const db = openDatabase();
  const config = readConfig();
  const mode = resolveMode(config);
  const apiKey = resolveApiKey(config);

  const rt: ToolRuntime = {
    mode,
    db,
    client:
      mode === "hosted" && apiKey ? new HostedClient({ apiKey }) : undefined,
  };

  if (mode === "hosted" && !apiKey) {
    console.error(
      "Hosted mode requested but no API key found. Run `graphmyanything-mcp sync` or set GRAPHMYANYTHING_API_KEY.",
    );
    process.exit(1);
  }

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
      description:
        "When to pick line/bar/area, theme, labels, and range for the chart tool",
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
      title: "Track",
      description: "Upsert by metric+ts; written/replaced counts.",
      inputSchema: trackToolInputSchema,
    },
    async (args) => {
      const result = await runTrack(rt, args);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  server.registerTool(
    "query",
    {
      title: "Query",
      description: "Summary + optional LTTB series.",
      inputSchema: queryToolInputSchema,
    },
    async (args) => {
      const result = await runQuery(rt, args);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  server.registerTool(
    "insight",
    {
      title: "Insight",
      description: "Trend, anomalies, naive forecast.",
      inputSchema: insightToolInputSchema,
    },
    async (args) => {
      const result = await runInsight(rt, args);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  server.registerTool(
    "forget",
    {
      title: "Forget",
      description: FORGET_TOOL_DESCRIPTION,
      inputSchema: forgetToolInputSchema,
    },
    async (args) => {
      const result = await runForget(rt, args);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  server.registerTool(
    "chart",
    {
      title: "Chart",
      description: CHART_TOOL_DESCRIPTION,
      inputSchema: chartToolInputSchema,
    },
    async (args) => {
      const result = await runChart(rt, args);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}