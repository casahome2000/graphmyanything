"use client";

import { useMemo, useState } from "react";
import {
  LLM_MODELS,
  PRICING_CHECKED_AT,
  PRICING_SOURCES,
  TOKEN_ASSUMPTIONS,
  tokenReductionPercent,
} from "@/lib/pricing/llm-token-pricing";
import {
  formatUsd,
  savingsPerChart,
  sessionSavings,
} from "@/lib/pricing/token-cost";

const FLAGSHIP_BY_PROVIDER = LLM_MODELS.filter((m) => m.tier === "flagship");
const ECONOMY_BY_PROVIDER = LLM_MODELS.filter((m) => m.tier === "economy");
const TOKEN_REDUCTION_PCT = tokenReductionPercent();

export function TokenComparison() {
  const [callsPerSession, setCallsPerSession] = useState<number>(
    TOKEN_ASSUMPTIONS.defaultCallsPerSession,
  );
  const [sessionsPerMonth, setSessionsPerMonth] = useState<number>(
    TOKEN_ASSUMPTIONS.defaultSessionsPerMonth,
  );

  const { inputTokens: pyIn, outputTokens: pyOut } =
    TOKEN_ASSUMPTIONS.throwawayPython;
  const { inputTokens: gmaIn, outputTokens: gmaOut } =
    TOKEN_ASSUMPTIONS.graphMyAnything;

  const comparisons = useMemo(() => {
    return LLM_MODELS.map((model) => {
      const chart = savingsPerChart(model, pyIn, pyOut, gmaIn, gmaOut);
      const session = sessionSavings(
        chart.saved,
        callsPerSession,
        sessionsPerMonth,
      );
      return { model, chart, session };
    });
  }, [pyIn, pyOut, gmaIn, gmaOut, callsPerSession, sessionsPerMonth]);

  const flagshipRows = comparisons.filter((c) => c.model.tier === "flagship");
  const economyRows = comparisons.filter((c) => c.model.tier === "economy");

  return (
    <section id="savings" className="scroll-mt-20 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="gradient-border overflow-hidden rounded-3xl p-8 sm:p-10 lg:p-12">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-300/90">
            Token efficiency estimate
          </p>
          <p className="mt-4 font-mono text-5xl font-bold tracking-tight text-[#f4f4f7] sm:text-6xl md:text-7xl">
            <span className="gradient-text">{TOKEN_REDUCTION_PCT}%</span>
            <span className="block text-3xl font-semibold text-[#f4f4f7] sm:mt-2 sm:text-4xl md:text-5xl">
              fewer tokens per chart
            </span>
          </p>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[#8b8b9e] sm:text-base">
            {TOKEN_ASSUMPTIONS.throwawayPython.totalTokens.toLocaleString()}{" "}
            estimated tokens with throwaway Python vs{" "}
            {TOKEN_ASSUMPTIONS.graphMyAnything.totalTokens} with one{" "}
            <span className="font-mono text-cyan-300/90">query</span> call.
            Published benchmark pending.
          </p>

          <div className="mt-8 grid gap-3 border-t border-white/[0.08] pt-8 sm:grid-cols-2">
            <TokenStatCard
              tone="rose"
              label={TOKEN_ASSUMPTIONS.throwawayPython.label}
              total={TOKEN_ASSUMPTIONS.throwawayPython.totalTokens}
              detail={`${pyIn.toLocaleString()} in · ${pyOut.toLocaleString()} out`}
            />
            <TokenStatCard
              tone="emerald"
              label={TOKEN_ASSUMPTIONS.graphMyAnything.label}
              total={TOKEN_ASSUMPTIONS.graphMyAnything.totalTokens}
              detail={`${gmaIn} in · ${gmaOut} out`}
            />
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-lg font-semibold text-[#f4f4f7]">
            What that saves in API spend
          </h3>
          <p className="mt-2 text-sm text-[#8b8b9e]">
            Dollar figures use official list prices (checked {PRICING_CHECKED_AT}
            ). Same token assumptions as above.
          </p>
        </div>

        <div className="glass mt-6 rounded-2xl p-6">
          <div className="mt-1 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-xs text-[#8b8b9e]">
                  <th className="pb-3 pr-4 font-medium">Model</th>
                  <th className="pb-3 pr-4 font-medium">Throwaway</th>
                  <th className="pb-3 pr-4 font-medium">GMA query</th>
                  <th className="pb-3 pr-4 font-medium">$ saved</th>
                  <th className="pb-3 font-medium">$ off</th>
                </tr>
              </thead>
              <tbody>
                {[...flagshipRows, ...economyRows].map(({ model, chart }) => (
                  <tr
                    key={model.modelId}
                    className="border-b border-white/[0.04] last:border-0"
                  >
                    <td className="py-3 pr-4">
                      <span className="text-[#f4f4f7]">{model.label}</span>
                      <span className="ml-2 text-xs text-[#8b8b9e]">
                        {model.provider}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono text-rose-300/90">
                      {formatUsd(chart.python)}
                    </td>
                    <td className="py-3 pr-4 font-mono text-emerald-300/90">
                      {formatUsd(chart.gma)}
                    </td>
                    <td className="py-3 pr-4 font-mono text-cyan-300">
                      {formatUsd(chart.saved)}
                    </td>
                    <td className="py-3 font-mono text-[#8b8b9e]">
                      {chart.pct.toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="gradient-border mt-8 rounded-2xl p-6 sm:p-8">
          <h3 className="text-base font-semibold text-[#f4f4f7]">
            Session & month (dollars)
          </h3>
          <p className="mt-1 text-sm text-[#8b8b9e]">
            Chart calls per session × sessions per month, at list price.
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-[#8b8b9e]">
                Chart calls per session
              </span>
              <div className="mt-2 flex items-center gap-4">
                <input
                  type="range"
                  min={1}
                  max={80}
                  value={callsPerSession}
                  onChange={(e) => setCallsPerSession(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer accent-violet-500"
                />
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={callsPerSession}
                  onChange={(e) =>
                    setCallsPerSession(
                      Math.max(1, Number(e.target.value) || 1),
                    )
                  }
                  className="w-16 rounded-lg border border-white/[0.1] bg-white/[0.04] px-2 py-1 text-center font-mono text-sm"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-sm text-[#8b8b9e]">
                Sessions per month
              </span>
              <input
                type="number"
                min={1}
                max={365}
                value={sessionsPerMonth}
                onChange={(e) =>
                  setSessionsPerMonth(Math.max(1, Number(e.target.value) || 1))
                }
                className="mt-2 w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-2.5 font-mono text-sm"
              />
            </label>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {FLAGSHIP_BY_PROVIDER.map((flagship) => {
              const economy = ECONOMY_BY_PROVIDER.find(
                (e) => e.provider === flagship.provider,
              );
              const f = comparisons.find(
                (c) => c.model.modelId === flagship.modelId,
              );
              const e = economy
                ? comparisons.find((c) => c.model.modelId === economy.modelId)
                : null;
              if (!f) return null;
              return (
                <div key={flagship.provider} className="glass rounded-xl p-4">
                  <p className="text-xs font-medium text-violet-300">
                    {flagship.provider}
                  </p>
                  <p className="mt-2 text-xs text-[#8b8b9e]">
                    {flagship.label} · flagship
                  </p>
                  <p className="font-mono text-lg text-[#f4f4f7]">
                    {formatUsd(f.session.perMonth, 2)}
                    <span className="text-sm font-normal text-emerald-400">
                      {" "}
                      /mo
                    </span>
                  </p>
                  {e && economy ? (
                    <p className="mt-2 text-xs text-[#8b8b9e]">
                      {economy.label}:{" "}
                      <span className="font-mono text-emerald-300">
                        {formatUsd(e.session.perMonth, 2)}/mo
                      </span>
                    </p>
                  ) : null}
                  <p className="mt-2 text-[11px] text-[#8b8b9e]">
                    {formatUsd(f.session.perSession, 3)} per session
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-[#8b8b9e]">
          {TOKEN_ASSUMPTIONS.throwawayPython.note}{" "}
          {TOKEN_ASSUMPTIONS.graphMyAnything.note} Prices from{" "}
          {PRICING_SOURCES.map((s, i) => (
            <span key={s.url}>
              {i > 0 ? (i === PRICING_SOURCES.length - 1 ? ", and " : ", ") : ""}
              <a
                href={s.url}
                className="text-cyan-400/90 underline-offset-2 hover:underline"
              >
                {s.name}
              </a>
            </span>
          ))}{" "}
          (checked {PRICING_CHECKED_AT}). Google uses standard post-promotional
          list prices: Gemini 4 Carbon $4/$20 per 1M from Dec 1, 2026; Gemini 3.8
          Flash $1.50/$7.50 per 1M from Jan 1, 2027. OpenAI and Anthropic models
          use current standard API rates with no scheduled step-up on those SKUs.
        </p>
      </div>
    </section>
  );
}

function TokenStatCard({
  tone,
  label,
  total,
  detail,
}: {
  tone: "rose" | "emerald";
  label: string;
  total: number;
  detail: string;
}) {
  const box =
    tone === "rose"
      ? "border-rose-500/15 bg-rose-500/[0.05]"
      : "border-emerald-500/15 bg-emerald-500/[0.05]";
  const valueClass =
    tone === "rose"
      ? "text-rose-300/90 text-xl font-mono font-semibold"
      : "text-xl font-mono font-semibold gradient-text";

  return (
    <div className={`rounded-xl border px-4 py-3 ${box}`}>
      <p className="text-xs text-[#8b8b9e]">{label}</p>
      <p className={`mt-1 ${valueClass}`}>
        {typeof total === "number" && total > 999
          ? total.toLocaleString()
          : total}{" "}
        <span className="text-sm font-normal text-[#8b8b9e]">tokens</span>
      </p>
      <p className="mt-1 text-[11px] text-[#8b8b9e]">{detail}</p>
    </div>
  );
}