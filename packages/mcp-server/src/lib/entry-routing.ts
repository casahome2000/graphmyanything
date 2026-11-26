export function hasStdioFlag(argv: string[] = process.argv): boolean {
  return argv.slice(2).includes("--stdio");
}

/** Whether to start the MCP stdio server (vs TTY install check or CLI). */
export function shouldStartMcpServer(
  stdinIsTty: boolean,
  stdioFlag: boolean,
  cliHandled: boolean,
): boolean {
  if (cliHandled) return false;
  return stdioFlag || !stdinIsTty;
}