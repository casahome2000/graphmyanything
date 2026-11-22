import { gmaToolsListJson } from "../../packages/mcp-server/src/tool-catalog.js";

/**
 * Representative Cursor coding-agent tool bundle (not exact byte match to a
 * live session). Tools: Shell, Read, Write, Grep, Glob, LS — shapes aligned
 * with common MCP/bash+file patterns agents use for Python E2E flows.
 * @see https://cursor.com/docs/agent/tools
 */
export const PYTHON_HARNESS_TOOLS_JSON = JSON.stringify({
  source: "Representative Cursor-style agent (6 tools)",
  tools: [
    {
      name: "Shell",
      description: "Run terminal commands (python, pip).",
      inputSchema: {
        type: "object",
        properties: { command: { type: "string" } },
        required: ["command"],
      },
    },
    {
      name: "Read",
      description: "Read file contents (optionally limit lines).",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string" },
          limit: { type: "number" },
        },
        required: ["path"],
      },
    },
    {
      name: "Write",
      description: "Write or patch a file.",
      inputSchema: {
        type: "object",
        properties: { path: { type: "string" }, contents: { type: "string" } },
        required: ["path", "contents"],
      },
    },
    {
      name: "Grep",
      description: "Ripgrep search in repository.",
      inputSchema: {
        type: "object",
        properties: { pattern: { type: "string" }, path: { type: "string" } },
        required: ["pattern"],
      },
    },
    {
      name: "Glob",
      description: "Find files by glob pattern.",
      inputSchema: {
        type: "object",
        properties: { pattern: { type: "string" } },
        required: ["pattern"],
      },
    },
    {
      name: "LS",
      description: "List directory entries.",
      inputSchema: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
      },
    },
  ],
});

export function gmaToolDefsJson(): string {
  return gmaToolsListJson();
}