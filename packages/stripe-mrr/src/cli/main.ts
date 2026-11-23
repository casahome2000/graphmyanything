import { assertNodeVersion } from "./bootstrap.js";
import { runBackfill } from "./commands/backfill.js";
import { runStatus } from "./commands/status.js";
import { runSync } from "./commands/sync.js";
import { readStripeRestrictedKey } from "./key.js";
import { createStripeClient, StripePermissionError } from "./stripe/client.js";

export async function runCli(argv = process.argv): Promise<number> {
  assertNodeVersion();

  const [, , cmd, ...rest] = argv;
  if (!cmd || cmd === "--help" || cmd === "-h") {
    console.log(usage());
    return 0;
  }

  try {
    if (cmd === "status") {
      runStatus();
      return 0;
    }

    const key = readStripeRestrictedKey();
    const fetch = createStripeClient(key);

    if (cmd === "backfill") {
      const fromIdx = rest.indexOf("--from");
      const toIdx = rest.indexOf("--to");
      const fromTs = fromIdx >= 0 ? Number(rest[fromIdx + 1]) : undefined;
      const toTs = toIdx >= 0 ? Number(rest[toIdx + 1]) : undefined;
      await runBackfill(fetch, { fromTs, toTs });
      return 0;
    }

    if (cmd === "sync") {
      await runSync(fetch);
      return 0;
    }

    console.error(`Unknown command: ${cmd}\n\n${usage()}`);
    return 1;
  } catch (err) {
    if (err instanceof StripePermissionError) {
      console.error(err.message);
      return 3;
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    return 1;
  }
}

function usage(): string {
  return `graphmyanything-stripe — Stripe MRR → GraphMyAnything metrics

Usage:
  graphmyanything-stripe backfill [--from <unixDay>] [--to <unixDay>]
  graphmyanything-stripe sync
  graphmyanything-stripe status

Environment:
  STRIPE_RESTRICTED_KEY   rk_test_… or rk_live_… (never sk_…)
  GRAPHMYANYTHING_DB_PATH SQLite metrics DB (default ~/.graphmyanything/metrics.db)
  GRAPHMYANYTHING_STRIPE_STATE_PATH  connector state JSON (no secrets)
  GRAPHMYANYTHING_API_KEY    optional: also upload to your hosted account (live chart links)
  GRAPHMYANYTHING_API_BASE   optional API base (default https://graphmyanything.com/api/v1)`;
}