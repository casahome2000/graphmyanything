import { formatPermissionHelp } from "../permissions.js";
import {
  mapCreditNote,
  mapInvoice,
  mapRefund,
  mapSubscription,
} from "./map.js";
import type {
  StripeCreditNote,
  StripeInvoice,
  StripeRefund,
  StripeSubscription,
} from "../../types.js";

const API = "https://api.stripe.com/v1";

export type StripeFetcher = (
  path: string,
  query?: Record<string, string>,
) => Promise<unknown>;

export class StripePermissionError extends Error {
  constructor(
    message: string,
    readonly stripeMessage?: string,
  ) {
    super(message);
    this.name = "StripePermissionError";
  }
}

export function createStripeClient(apiKey: string): StripeFetcher {
  return async (path, query = {}) => {
    const url = new URL(`${API}${path}`);
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    }

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Stripe-Version": "2024-11-20.acacia",
      },
    });

    const body = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    if (res.status === 403) {
      const msg =
        typeof body.error === "object" && body.error
          ? String((body.error as { message?: string }).message ?? "")
          : "";
      throw new StripePermissionError(formatPermissionHelp(msg || undefined), msg);
    }

    if (!res.ok) {
      const msg =
        typeof body.error === "object" && body.error
          ? String((body.error as { message?: string }).message ?? res.statusText)
          : res.statusText;
      throw new Error(`Stripe API ${res.status}: ${msg}`);
    }

    return body;
  };
}

async function listAll<T>(
  fetch: StripeFetcher,
  path: string,
  baseQuery: Record<string, string>,
  map: (raw: Record<string, unknown>) => T,
): Promise<T[]> {
  const out: T[] = [];
  let startingAfter: string | undefined;

  for (;;) {
    const query: Record<string, string> = { ...baseQuery, limit: "100" };
    if (startingAfter) query.starting_after = startingAfter;

    const page = (await fetch(path, query)) as {
      data: Record<string, unknown>[];
      has_more: boolean;
    };

    for (const row of page.data) {
      out.push(map(row));
    }

    if (!page.has_more || page.data.length === 0) break;
    startingAfter = String(page.data[page.data.length - 1]!.id);
  }

  return out;
}

export async function fetchAllBillingData(fetch: StripeFetcher): Promise<{
  subscriptions: StripeSubscription[];
  invoices: StripeInvoice[];
  refunds: StripeRefund[];
  creditNotes: StripeCreditNote[];
}> {
  const [subscriptions, invoices, refunds, creditNotes] = await Promise.all([
    listAll(
      fetch,
      "/subscriptions",
      {
        status: "all",
        "expand[]": "data.items.data.price",
      },
      mapSubscription,
    ),
    listAll(fetch, "/invoices", { status: "paid" }, mapInvoice),
    listAll(fetch, "/refunds", {}, mapRefund),
    listAll(fetch, "/credit_notes", {}, mapCreditNote),
  ]);

  return { subscriptions, invoices, refunds, creditNotes };
}