import { HostedClient } from "../hosted/client.js";
import { openDatabase, totalPointCount } from "../db.js";
import { uploadLocalBacklogToHosted } from "../lib/local-backlog-upload.js";
import { redactSecretsInText } from "../lib/mask-secret.js";
import { resolveApiKey } from "../mode.js";
import { linkDevice } from "./sync-auth.js";
import { setStoredApiKey } from "../secrets/store.js";

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
  let uploaded = 0;

  try {
    const result = await uploadLocalBacklogToHosted(authed, db);
    uploaded = result.uploaded;
    if (uploaded > 0) {
      process.stderr.write(
        `Uploaded ${uploaded}/${total} points…\n`,
      );
    }
  } catch (e) {
    db.close();
    const msg = e instanceof Error ? e.message : String(e);
    console.error(
      `Upload stopped after ${uploaded}/${total} points: ${redactSecretsInText(msg)}\n` +
        "Your API key is saved; run `graphmyanything-mcp sync` again to resume.",
    );
    return 1;
  }

  db.close();
  console.log(`Sync complete. Hosted mode is on; local DB kept as backup (${total} points).`);
  return 0;
}