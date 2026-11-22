import { WaitlistForm } from "./WaitlistForm";
import { PreorderButton } from "./PreorderButton";
import { MetricChartVisual } from "./MetricChartVisual";
import { tokenReductionPercent } from "@/lib/pricing/llm-token-pricing";

const TOKEN_REDUCTION_PCT = tokenReductionPercent();

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
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_minmax(0,420px)] lg:gap-10 xl:grid-cols-[1fr_minmax(0,460px)]">
          <div>
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-[#8b8b9e]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              Metric memory for AI agents · MCP
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[#f4f4f7] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              The place agents keep their{" "}
              <span className="gradient-text">numbers</span>.
            </h1>
            <p className="mt-5 max-w-2xl text-sm font-medium text-cyan-300/90">
              ~{TOKEN_REDUCTION_PCT}% fewer tokens per chart vs throwaway
              Python
              <span className="font-normal text-[#8b8b9e]">
                {" "}
                · estimate, benchmark pending
              </span>
            </p>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#8b8b9e] sm:text-xl">
              One call instead of throwaway Python—and your data gets smarter.
              Each metric lives in its own namespace with short-term memory
              (recent readings) and long-term memory (years of history). Agents
              read token-efficient summaries, not raw points.
            </p>
            <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              <WaitlistForm />
            </div>
            <div className="mt-4">
              <PreorderButton placement="hero" />
            </div>
            <p className="mt-8 max-w-xl text-sm text-[#8b8b9e]/90">
              Sits next to text-memory tools like Mem0 and Zep—complementary,
              not competitive. Numbers over time only.
            </p>
          </div>
          <div className="relative hidden lg:block">
            <div
              className="pointer-events-none absolute -inset-6 rounded-3xl bg-gradient-to-br from-violet-500/15 via-cyan-400/10 to-transparent blur-2xl"
              aria-hidden
            />
            <MetricChartVisual variant="hero" showUrl={false} />
          </div>
        </div>
      </div>
    </section>
  );
}