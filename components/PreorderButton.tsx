"use client";

import {
  appendAttributionToPreorderUrl,
  readAttributionFromSession,
} from "@/lib/attribution";
import { trackPreorderClick } from "@/lib/analytics/growth-events";

export type PreorderPlacement =
  | "hero"
  | "pricing"
  | "waitlist-success";

type PreorderButtonProps = {
  placement: PreorderPlacement;
  className?: string;
};

export function PreorderButton({ placement, className = "" }: PreorderButtonProps) {
  const baseUrl = process.env.NEXT_PUBLIC_PREORDER_URL?.trim() ?? "";
  const isReady = baseUrl.length > 0;

  function handleClick() {
    const navigate = () => {
      if (!isReady) {
        document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });
        return;
      }
      const url = appendAttributionToPreorderUrl(
        baseUrl,
        readAttributionFromSession(),
      );
      window.open(url, "_blank", "noopener,noreferrer");
    };

    trackPreorderClick(
      {
        placement,
        available: isReady,
      },
      navigate,
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        className ||
        "group flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.03] px-5 text-sm font-medium text-[#f4f4f7] transition hover:border-white/[0.2] hover:bg-white/[0.06] sm:w-auto"
      }
      aria-label={
        isReady
          ? "Founding member preorder for one-time $49"
          : "Founding member preorder — join waitlist until checkout is live"
      }
    >
      <span className="text-[#8b8b9e] transition-colors group-hover:text-[#f4f4f7]">
        Founding member
      </span>
      <span className="text-violet-300">$49 once</span>
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