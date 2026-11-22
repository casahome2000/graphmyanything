/** MCP tools/list payload shape (for benchmarks and registration). */

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
        metric: { type: "string", description: "e.g. stripe.mrr" },
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
    description:
      "Terse summary (s.l/mn/mx/mu/tr/pct/n). points: auto|0|N for LTTB series.",
    inputSchema: {
      type: "object",
      properties: {
        metric: { type: "string" },
        range: { type: "string", description: "7d, 90d, 1y, all" },
        token_budget: { type: "number" },
        points: { oneOf: [{ type: "number" }, { const: "auto" }] },
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
    description: "SVG to local file; returns path and URL.",
    inputSchema: {
      type: "object",
      properties: {
        metric: { type: "string" },
        range: { type: "string" },
        type: { enum: ["line", "bar", "area"] },
        theme: { enum: ["dark", "light"] },
      },
      required: ["metric"],
    },
  },
];

export function gmaToolsListJson(): string {
  return JSON.stringify({ tools: GMA_TOOL_CATALOG });
}