import { describe, expect, it } from "vitest";
import { backfillDailyHistory } from "../src/backfill/reconstruct.js";
import { METRIC } from "../src/metrics.js";
import { netRevenueByCurrencyOnDay } from "../src/mrr/net-revenue.js";
import { day, monthlySub } from "./helpers.js";

describe("backfillDailyHistory", () => {
  it("reconstructs MRR and subscriber series with new/churn deltas", () => {
    const subA = monthlySub({
      id: "sub_a",
      created: day(0),
      unitAmount: 10_000,
    });
    const subB = monthlySub({
      id: "sub_b",
      created: day(2),
      unitAmount: 5_000,
    });
    const subDone = monthlySub({
      id: "sub_c",
      created: day(0),
      unitAmount: 2_000,
      ended_at: day(4),
      status: "canceled",
      canceled_at: day(4),
    });

    const { series } = backfillDailyHistory({
      subscriptions: [subA, subB, subDone],
      fromTs: day(0),
      toTs: day(5),
    });

    const mrr = series.find((s) => s.metric === METRIC.mrr("usd"))!;
    expect(mrr.points.find((p) => p.ts === day(1))!.value).toBe(120);
    expect(mrr.points.find((p) => p.ts === day(2))!.value).toBe(170);

    const subs = series.find((s) => s.metric === METRIC.subscribers())!;
    expect(subs.points.find((p) => p.ts === day(3))!.value).toBe(3);

    const churned = series.find((s) => s.metric === METRIC.mrrChurned("usd"))!;
    const churnDay = churned.points.find((p) => p.ts === day(4));
    expect(churnDay?.value).toBe(20);

    const newMrr = series.find((s) => s.metric === METRIC.mrrNew("usd"))!;
    const newDay = newMrr.points.find((p) => p.ts === day(2));
    expect(newDay?.value).toBe(50);
  });

  it("computes net revenue from invoices refunds and credit notes", () => {
    const day0 = day(0);
    const net = netRevenueByCurrencyOnDay(
      day0,
      [
        {
          id: "in_1",
          currency: "usd",
          status: "paid",
          paid: true,
          paid_at: day0 + 3600,
          amount_paid: 5000,
          total: 5000,
          tax: 0,
          subscription: "sub_a",
        },
      ],
      [
        {
          id: "re_1",
          currency: "usd",
          amount: 1000,
          created: day0 + 7200,
          charge: "ch_1",
        },
      ],
      [
        {
          id: "cn_1",
          currency: "usd",
          amount: 500,
          created: day0 + 10800,
          invoice: "in_1",
          type: "post_payment",
          status: "issued",
        },
      ],
    );
    expect(net.get("usd")).toBe(35);
  });
});