import { MIN_NODE, nodeTooOld } from "../bootstrap.js";
import { PACKAGE_VERSION } from "../version.js";
import { QUICKSTART_URL } from "./site-urls.js";

export function formatNodeCheckLine(nodeVersion = process.versions.node): string {
  const req = `>=${MIN_NODE.major}.${MIN_NODE.minor}.${MIN_NODE.patch}`;
  if (nodeTooOld(nodeVersion)) {
    return `Node.js ${nodeVersion}: warning — requires ${req} (built-in node:sqlite)`;
  }
  return `Node.js ${nodeVersion}: OK (requires ${req})`;
}

/** stderr lines when a human runs bare `graphmyanything-mcp` on a TTY (no MCP client). */
export function printTtyBareInstallCheck(
  write = (line: string) => console.error(line),
): void {
  write(`graphmyanything-mcp ${PACKAGE_VERSION} installed.`);
  write(formatNodeCheckLine());
  write(
    `Add it to your AI client's MCP config (pick your client): ${QUICKSTART_URL}`,
  );
}