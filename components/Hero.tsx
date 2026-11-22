import { WaitlistForm } from "./WaitlistForm";
import { PreorderButton } from "./PreorderButton";

export function Hero() {
  return (
    <section
      id="waitlist"
      className="mesh-bg relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-24 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px] animate-pulse-glow"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-[#8b8b9e]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          Metric memory for AI agents · MCP
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[#f4f4f7] sm:text-5xl md:text-6xl md:leading-[1.08]">
          The place agents keep their{" "}
          <span className="gradient-text">numbers</span>.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#8b8b9e] sm:text-xl">
          One call instead of throwaway Python—and your data gets smarter. Each
          metric lives in its own namespace with short-term memory (recent
          readings) and long-term memory (years of history). Agents read
          token-efficient summaries, not raw points.
        </p>
        <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          <WaitlistForm />
        </div>
        <div className="mt-4">
          <PreorderButton />
        </div>
        <p className="mt-8 max-w-xl text-sm text-[#8b8b9e]/90">
          Sits next to text-memory tools like Mem0 and Zep—complementary, not
          competitive. Numbers over time only.
        </p>
      </div>
    </section>
  );
}