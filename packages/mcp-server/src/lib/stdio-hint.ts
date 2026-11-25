import { DOCS_URL } from "./site-urls.js";

export const MCP_TTY_STARTUP_MESSAGE =
  `graphmyanything-mcp is running and waiting for an MCP client. Add it to your client config: ${DOCS_URL}  (Ctrl+C to exit)`;

/** One-line stderr hint when a human runs the server on a TTY (not piped stdio). */
export function maybePrintMcpTtyHint(stdinIsTty = process.stdin.isTTY): void {
  if (stdinIsTty) {
    console.error(MCP_TTY_STARTUP_MESSAGE);
  }
}