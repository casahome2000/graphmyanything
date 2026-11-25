import { HostedClient } from "../hosted/client.js";
import { redactSecretsInText } from "../lib/mask-secret.js";
import { readConfig, resolveConfigPath } from "../config.js";
import { resolveApiKey, resolveMode } from "../mode.js";
import { openDatabase, totalPointCount } from "../db.js";
import { resolveDbPath } from "../db.js";

export async function runStatus(): Promise<number> {
  const config = readConfig();
  const mode = resolveMode(config);
  const db = openDatabase();
  const points = totalPointCount(db);
  db.close();

  console.log(`Mode: ${mode}`);
  console.log(`Config: ${resolveConfigPath()}`);
  console.log(`Database: ${resolveDbPath()} (${points} points)`);

  if (mode === "hosted") {
    const key = resolveApiKey(config);
    if (!key) {
      console.log("Hosted mode expected but no API key found.");
      return 1;
    }
    try {
      const client = new HostedClient({ apiKey: key });
      const account = await client.getAccount();
      console.log(`Plan: ${account.plan}`);
      if (account.usage) {
        console.log(
          `Cloud usage: ${account.usage.points ?? "?"} points, ${account.usage.metrics ?? "?"} metrics`,
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`Could not reach GraphMyAnything API: ${redactSecretsInText(msg)}`);
      return 1;
    }
  } else {
    console.log("Run `graphmyanything-mcp sync` to enable hosted backup and live chart links.");
  }
  return 0;
}