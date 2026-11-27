import type { GmaDatabase } from "../db.js";
import { listPointsAfterId, totalPointCount } from "../db.js";
import { readConfig, writeConfig } from "../config.js";
import type { HostedClient } from "../hosted/client.js";

const BATCH = 1000;

/** Upload local SQLite points not yet checkpointed (same logic as `sync`). */
export async function uploadLocalBacklogToHosted(
  client: HostedClient,
  db: GmaDatabase,
): Promise<{ uploaded: number; total: number }> {
  const total = totalPointCount(db);
  let afterId = readConfig().sync_after_id ?? 0;
  let uploaded = 0;

  while (true) {
    const batch = listPointsAfterId(db, afterId, BATCH);
    if (batch.length === 0) break;

    await client.trackBatch(
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
  }

  return { uploaded, total };
}