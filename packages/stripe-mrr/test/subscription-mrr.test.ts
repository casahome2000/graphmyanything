import { describe, expect, it } from "vitest";
import {
  countsAsSubscriber,
  subscriptionMrrOnDay,
} from "../src/mrr/subscription-mrr.js";
import { day, monthlySub } from "./helpers.js";

describe("subscription MRR edge cases", () => {
  it("excludes metered usage items", () => {
    const sub = monthlySub({ unitAmount: 2000, usageType: "metered" });
    expect(subscriptionMrrOnDay(sub, day(1))).toEqual({
      currency: "usd",
      mrr: 0,
    });
    expect(countsAsSubscriber(sub, day(1))).toBe(true);
  });

  it("counts trial as zero MRR until converted", () => {
    const sub = monthlySub({
      status: "trialing",
      trial_start: day(0),
      trial_end: day(14),
    });
    expect(subscriptionMrrOnDay(sub, day(7))).toEqual({
      currency: "usd",
      mrr: 0,
    });
    expect(countsAsSubscriber(sub, day(7))).toBe(false);
    sub.status = "active";
    expect(subscriptionMrrOnDay(sub, day(15))!.mrr).toBe(50);
  });

  it("counts cancel_at_period_end until period end", () => {
    const sub = monthlySub({
      cancel_at_period_end: true,
      current_period_end: day(20),
      status: "active",
    });
    expect(subscriptionMrrOnDay(sub, day(19))!.mrr).toBe(50);
    expect(subscriptionMrrOnDay(sub, day(20))).toBeNull();
    expect(countsAsSubscriber(sub, day(20))).toBe(false);
  });

  it("paused subscription counts zero", () => {
    const sub = monthlySub({
      status: "paused",
      pause_collection: { behavior: "mark_uncollectible", resumes_at: day(10) },
    });
    expect(subscriptionMrrOnDay(sub, day(5))).toBeNull();
    expect(countsAsSubscriber(sub, day(5))).toBe(false);
  });

  it("past_due still counts toward MRR", () => {
    const sub = monthlySub({ status: "past_due" });
    expect(subscriptionMrrOnDay(sub, day(1))!.mrr).toBe(50);
    expect(countsAsSubscriber(sub, day(1))).toBe(true);
  });

  it("applies forever percent discount", () => {
    const sub = monthlySub({
      discount: {
        start: day(0),
        end: null,
        coupon: {
          id: "coup",
          percent_off: 20,
          amount_off: null,
          currency: null,
          duration: "forever",
          duration_in_months: null,
        },
      },
    });
    expect(subscriptionMrrOnDay(sub, day(5))!.mrr).toBe(40);
  });

  it("100% coupon yields zero", () => {
    const sub = monthlySub({
      discount: {
        start: day(0),
        end: null,
        coupon: {
          id: "coup",
          percent_off: 100,
          amount_off: null,
          currency: null,
          duration: "forever",
          duration_in_months: null,
        },
      },
    });
    expect(subscriptionMrrOnDay(sub, day(5))!.mrr).toBe(0);
  });

  it("once discount only in its window", () => {
    const sub = monthlySub({
      discount: {
        start: day(0),
        end: day(30),
        coupon: {
          id: "coup",
          percent_off: 50,
          amount_off: null,
          currency: null,
          duration: "once",
          duration_in_months: null,
        },
      },
    });
    expect(subscriptionMrrOnDay(sub, day(5))!.mrr).toBe(25);
    expect(subscriptionMrrOnDay(sub, day(35))!.mrr).toBe(50);
  });

  it("repeating discount expires after duration_in_months", () => {
    const sub = monthlySub({
      discount: {
        start: day(0),
        end: null,
        coupon: {
          id: "coup",
          percent_off: 50,
          amount_off: null,
          currency: null,
          duration: "repeating",
          duration_in_months: 2,
        },
      },
    });
    expect(subscriptionMrrOnDay(sub, day(10))!.mrr).toBe(25);
    expect(subscriptionMrrOnDay(sub, day(90))!.mrr).toBe(50);
  });

  it("keeps currencies separate", () => {
    const sub = monthlySub({
      items: {
        data: [
          {
            id: "si_eur",
            quantity: 1,
            price: {
              id: "price_eur",
              currency: "eur",
              unit_amount: 4000,
              recurring: {
                interval: "month",
                interval_count: 1,
                usage_type: "licensed",
              },
            },
          },
        ],
      },
    });
    expect(subscriptionMrrOnDay(sub, day(1))).toEqual({
      currency: "eur",
      mrr: 40,
    });
  });
});