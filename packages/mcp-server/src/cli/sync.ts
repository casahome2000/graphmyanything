import { HostedClient } from "../hosted/client.js";
import {
  listPointsAfterId,
  openDatabase,
  totalPointCount,
} from "../db.js";
import { readConfig, writeConfig } from "../config.js";
import { redactSecretsInText } from "../lib/mask-secret.js";
import { resolveApiKey } from "../mode.js";

const BATCH = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function linkDevice(): Promise<string | undefined> {
  const client = new HostedClient({ apiKey: "" });
  const start = await client.deviceStart();

  console.log(
    `Visit ${start.verification_uri} and enter code ${start.user_code}`,
  );
  console.log(`Or open ${start.verification_uri}?user_code=${start.user_code}`);

  let intervalSec = start.interval;
  const deadline = Date.now() + start.expires_in * 1000;

  while (Date.now() < deadline) {
    await sleep(intervalSec * 1000);
    const tok = await client.deviceToken(start.device_code);
    if (tok.status === "authorized") return tok.api_key;
    if (tok.status === "expired") {
      console.error("Device code expired. Run sync again.");
      return undefined;
    }
    if (tok.status === "slow_down") intervalSec += 5;
  }
  console.error("Timed out waiting for authorization.");
  return undefined;
}

export async function runSync(): Promise<number> {
  // Reuse a saved key (resume after an interrupted upload) instead of
  // asking the user to approve a new device every time.
  let apiKey = resolveApiKey();
  if (apiKey) {
    try {
      await new HostedClient({ apiKey }).getAccount();
    } catch {
      apiKey = undefined;
    }
  }
  if (!apiKey) apiKey = await linkDevice();
  if (!apiKey) return 1;

  writeConfig({ api_key: apiKey, mode: "hosted" });

  const authed = new HostedClient({ apiKey });
  const account = await authed.getAccount();
  console.log(
    `Signed in. Plan: ${account.plan}. Points: ${account.usage?.points ?? "?"} / ${account.limits?.points ?? "∞"}.`,
  );

  const db = openDatabase();
  const total = totalPointCount(db);
  let afterId = readConfig().sync_after_id ?? 0;
  let uploaded = 0;

  while (true) {
    const batch = listPointsAfterId(db, afterId, BATCH);
    if (batch.length === 0) break;

    try {
      await authed.trackBatch(
        batch.map((r) => ({
          metric: r.metric,
          ts: r.ts,
          value: r.value,
          tags: r.tags,
        })),
      );
    } catch (e) {
      db.close();
      const msg = e instanceof Error ? e.message : String(e);
      console.error(
        `Upload stopped after ${uploaded}/${total} points: ${redactSecretsInText(msg)}\n` +
          "Your API key is saved; run `graphmyanything-mcp sync` again to resume.",
      );
      return 1;
    }

    afterId = batch[batch.length - 1]!.id;
    uploaded += batch.length;
    writeConfig({ sync_after_id: afterId });
    process.stderr.write(
      `Uploaded ${uploaded}/${total} points (checkpoint id ${afterId})…\n`,
    );
  }

  db.close();
  console.log(`Sync complete. Hosted mode is on; local DB kept as backup (${total} points).`);
  return 0;
}