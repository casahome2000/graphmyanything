import { HostedClient } from "../hosted/client.js";
import {
  listPointsAfterId,
  openDatabase,
  totalPointCount,
} from "../db.js";
import { readConfig, writeConfig } from "../config.js";
import { redactSecretsInText } from "../lib/mask-secret.js";
import { resolveApiKey } from "../mode.js";
import { linkDevice } from "./sync-auth.js";
import { setStoredApiKey } from "../secrets/store.js";

const BATCH = 1000;

export async function runSync(): Promise<number> {
  let apiKey = resolveApiKey();
  let accountEmail: string | undefined;
  if (apiKey) {
    try {
      await new HostedClient({ apiKey }).getAccount();
    } catch {
      apiKey = undefined;
    }
  }
  if (!apiKey) {
    const linked = await linkDevice();
    if (!linked) return 1;
    apiKey = linked.api_key;
    accountEmail = linked.account_email;
  }

  setStoredApiKey(apiKey);

  const authed = new HostedClient({ apiKey });
  const account = await authed.getAccount();
  const email =
    accountEmail ||
    (typeof account.email === "string" ? account.email : undefined);
  if (email) {
    console.log(`Connected as ${email}`);
  }
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