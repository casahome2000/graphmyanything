"use client";

import { FormEvent, useState } from "react";
import { attributionForApi, readAttributionFromSession } from "@/lib/attribution";
import {
  trackGrowthEvent,
  trackWaitlistError,
} from "@/lib/analytics/growth-events";
import { PreorderButton } from "./PreorderButton";

type Status = "idle" | "loading" | "success" | "error";

const FORM_SOURCE = "landing-hero";

export function WaitlistForm({ id }: { id?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    const snap = readAttributionFromSession();
    const body = attributionForApi(snap, FORM_SOURCE);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          ...body,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        isNew?: boolean;
      };
      if (!res.ok || !data.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong.");
        trackWaitlistError(data.error ?? `http_${res.status}`, {
          source: FORM_SOURCE,
        });
        return;
      }
      if (data.isNew) {
        trackGrowthEvent("waitlist_submit", { source: FORM_SOURCE });
      }
      setStatus("success");
      setMessage(
        data.isNew
          ? "You're on the list. We'll be in touch."
          : "You're already on the list — thanks for checking in.",
      );
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
      trackWaitlistError("network", { source: FORM_SOURCE });
    }
  }

  return (
    <div id={id} className="w-full max-w-md">
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 sm:flex-row sm:items-stretch"
        aria-label="Waitlist signup"
      >
        <label className="sr-only" htmlFor="waitlist-email">
          Email address
        </label>
        <input
          id="waitlist-email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          disabled={status === "loading" || status === "success"}
          className="min-h-11 flex-1 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 text-sm text-[#f4f4f7] placeholder:text-[#8b8b9e]/80 outline-none ring-violet-500/0 transition focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="min-h-11 shrink-0 rounded-xl bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 px-6 text-sm font-semibold text-[#06060a] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading" ? "Joining…" : "Join waitlist"}
        </button>
      </form>
      {message ? (
        <p
          role="status"
          className={`mt-3 text-sm ${status === "error" ? "text-rose-400" : "text-emerald-400"}`}
        >
          {message}
        </p>
      ) : null}
      {status === "success" ? (
        <div className="mt-4">
          <PreorderButton placement="waitlist-success" />
        </div>
      ) : null}
    </div>
  );
}