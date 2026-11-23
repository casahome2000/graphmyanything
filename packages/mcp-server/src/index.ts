#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
import { runCli } from "./cli/main.js";

async function main(): Promise<void> {
  if (await runCli()) return;
  const { startMcpServer } = await import("./mcp-server.js");
  await startMcpServer();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});