import { buildDaySnapshot, mrrDeltasBetweenDays } from "../../mrr/snapshot.js";
import { METRIC, snapshotToMetricSeries } from "../../metrics.js";
import { utcDayStart } from "../../mrr/subscription-mrr.js";
import {
  openMetricsDb,
  pushHostedTrackHook,
  upsertMetricSeries,
} from "../metrics-store.js";
import { loadState, saveState } from "../state.js";
import { fetchAllBillingData, type StripeFetcher } from "../stripe/client.js";

export async function runSync(fetch: StripeFetcher): Promise<void> {
  const data = await fetchAllBillingData(fetch);
  const today = utcDayStart(Math.floor(Date.now() / 1000));
  const yesterday = today - 86400;

  const todaySnap = buildDaySnapshot(
    today,
    data.subscriptions,
    data.invoices,
    data.refunds,
    data.creditNotes,
  );
  const ySnap = buildDaySnapshot(
    yesterday,
    data.subscriptions,
    data.invoices,
    data.refunds,
    data.creditNotes,
  );

  const deltas = mrrDeltasBetweenDays(ySnap, todaySnap);
  const newMrr = new Map<string, number>();
  const churnedMrr = new Map<string, number>();
  for (const d of deltas) {
    if (d.newMrr > 0) newMrr.set(d.currency, d.newMrr);
    if (d.churnedMrr > 0) churnedMrr.set(d.currency, d.churnedMrr);
  }

  const series = snapshotToMetricSeries([
    {
      ts: today,
      mrr: todaySnap.mrr,
      subscribers: todaySnap.subscribers,
      newMrr,
      churnedMrr,
      netRevenue: todaySnap.netRevenue,
    },
  ]);

  const db = openMetricsDb();
  const result = upsertMetricSeries(db, series);
  await pushHostedTrackHook(series);

  const state = loadState();
  const currencies = [
    ...new Set([
      ...(state?.currencies ?? []),
      ...[...todaySnap.mrr.keys()],
    ]),
  ];

  saveState({
    lastSyncUtcDay: today,
    subscriptionCount: data.subscriptions.length,
    currencies,
    lastWrite: result,
  });

  const mrrUsd = todaySnap.mrr.get("usd");
  console.log(
    JSON.stringify(
      {
        ok: true,
        command: "sync",
        utcDay: today,
        subscribers: todaySnap.subscribers,
        mrrUsd,
        metrics: [METRIC.subscribers(), METRIC.mrr("usd")],
        pointsWritten: result.written,
        pointsReplaced: result.replaced,
      },
      null,
      2,
    ),
  );
}