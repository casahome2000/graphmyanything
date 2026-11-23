import { backfillDailyHistory } from "../../backfill/reconstruct.js";
import { utcDayStart } from "../../mrr/subscription-mrr.js";
import {
  openMetricsDb,
  pushHostedTrackHook,
  upsertMetricSeries,
} from "../metrics-store.js";
import { saveState } from "../state.js";
import { fetchAllBillingData, type StripeFetcher } from "../stripe/client.js";

export type BackfillOptions = {
  fromTs?: number;
  toTs?: number;
};

export async function runBackfill(
  fetch: StripeFetcher,
  opts: BackfillOptions = {},
): Promise<void> {
  const data = await fetchAllBillingData(fetch);
  const toTs = opts.toTs ?? utcDayStart(Math.floor(Date.now() / 1000));
  const { series } = backfillDailyHistory({
    ...data,
    fromTs: opts.fromTs,
    toTs,
  });

  const db = openMetricsDb();
  const result = upsertMetricSeries(db, series);
  await pushHostedTrackHook(series);

  const currencies = [
    ...new Set(
      data.subscriptions.flatMap((s) =>
        s.items.data.map((i) => i.price.currency.toLowerCase()),
      ),
    ),
  ];

  saveState({
    lastBackfillUtcDay: toTs,
    lastSyncUtcDay: toTs,
    subscriptionCount: data.subscriptions.length,
    currencies,
    lastWrite: result,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        command: "backfill",
        metrics: series.length,
        pointsWritten: result.written,
        pointsReplaced: result.replaced,
        toUtcDay: toTs,
        subscriptions: data.subscriptions.length,
      },
      null,
      2,
    ),
  );
}