import { HostedClient } from "../hosted/client.js";
import {
  listPointsAfterId,
  openDatabase,
  totalPointCount,
} from "../db.js";
import { readConfig, writeConfig } from "../config.js";

const BATCH = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runSync(): Promise<number> {
  const client = new HostedClient({ apiKey: "" });
  const start = await client.deviceStart();

  console.log(
    `Visit ${start.verification_uri} and enter code ${start.user_code}`,
  );
  console.log(`Or open ${start.verification_uri}?user_code=${start.user_code}`);

  let intervalSec = start.interval;
  const deadline = Date.now() + start.expires_in * 1000;
  let apiKey: string | undefined;

  while (Date.now() < deadline) {
    await sleep(intervalSec * 1000);
    const tok = await client.deviceToken(start.device_code);
    if (tok.status === "authorized") {
      apiKey = tok.api_key;
      break;
    }
    if (tok.status === "expired") {
      console.error("Device code expired. Run sync again.");
      return 1;
    }
    if (tok.status === "slow_down") intervalSec += 5;
  }

  if (!apiKey) {
    console.error("Timed out waiting for authorization.");
    return 1;
  }

  writeConfig({ api_key: apiKey, mode: "hosted" });

  const authed = new HostedClient({ apiKey });
  const account = await authed.getAccount();
  console.log(
    `Signed in. Plan: ${account.plan}. Points: ${account.usage?.points ?? "?"} / ${account.limits.max_points ?? "∞"}.`,
  );

  const db = openDatabase();
  const total = totalPointCount(db);
  let afterId = readConfig().sync_after_id ?? 0;
  let uploaded = 0;

  while (true) {
    const batch = listPointsAfterId(db, afterId, BATCH);
    if (batch.length === 0) break;

    await authed.trackBatch(
      batch.map((r) => ({
        metric: r.metric,
        ts: r.ts,
        value: r.value,
        tags: r.tags,
      })),
    );

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