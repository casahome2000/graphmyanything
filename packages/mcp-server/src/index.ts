#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
import { runCli } from "./cli/main.js";
import { startMcpServer } from "./mcp-server.js";

async function main(): Promise<void> {
  if (await runCli()) return;
  await startMcpServer();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});