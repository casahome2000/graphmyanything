"use client";

import { captureEvent } from "@/lib/posthog-client";

export function PreorderButton() {
  const url = process.env.NEXT_PUBLIC_PREORDER_URL;
  const isReady = Boolean(url && url.length > 0);

  function handleClick() {
    captureEvent("preorder_click", { available: isReady });
    if (!isReady) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isReady}
      className="group flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.03] px-5 text-sm font-medium text-[#f4f4f7] transition hover:border-white/[0.2] hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      aria-label={
        isReady
          ? "Founding member preorder for $49 per year"
          : "Founding member preorder coming soon"
      }
    >
      <span className="text-[#8b8b9e] group-hover:text-[#f4f4f7] transition-colors">
        Founding member
      </span>
      <span className="text-violet-300">$49/yr</span>
      <span className="hidden text-xs text-[#8b8b9e] sm:inline">
        · refundable until launch
      </span>
      {!isReady ? (
        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#8b8b9e]">
          Coming soon
        </span>
      ) : null}
    </button>
  );
}