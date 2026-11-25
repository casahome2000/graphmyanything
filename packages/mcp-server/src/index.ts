#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
import { runCli } from "./cli/main.js";
import { runSelfTest } from "./cli/self-test.js";
import { isVersionFlag } from "./cli/usage.js";
import { redactSecretsInText } from "./lib/mask-secret.js";
import { PACKAGE_VERSION } from "./version.js";

async function main(): Promise<void> {
  const arg = process.argv[2];
  if (isVersionFlag(arg)) {
    console.log(PACKAGE_VERSION);
    return;
  }
  if (arg === "--self-test") {
    process.exit(await runSelfTest());
  }
  if (await runCli()) return;
  const { startMcpServer } = await import("./mcp-server.js");
  await startMcpServer();
}

main().catch((err) => {
  const msg = err instanceof Error ? err.stack ?? err.message : String(err);
  console.error(redactSecretsInText(msg));
  process.exit(1);
});