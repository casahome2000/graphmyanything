"use client";

import { useMemo, useState } from "react";
import {
  LLM_MODELS,
  PRICING_CHECKED_AT,
  PRICING_SOURCES,
  TOKEN_ASSUMPTIONS,
} from "@/lib/pricing/llm-token-pricing";
import {
  formatUsd,
  savingsPerChart,
  sessionSavings,
} from "@/lib/pricing/token-cost";

const FLAGSHIP_BY_PROVIDER = LLM_MODELS.filter((m) => m.tier === "flagship");
const ECONOMY_BY_PROVIDER = LLM_MODELS.filter((m) => m.tier === "economy");

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
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Token cost—and real dollars saved
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-[#8b8b9e]">
          Token counts are{" "}
          <span className="text-[#f4f4f7]">estimates</span> until our published
          benchmark. Dollar math uses each provider&apos;s{" "}
          <span className="text-[#f4f4f7]">official list prices</span>{" "}
          (checked {PRICING_CHECKED_AT}).
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-6">
            <h3 className="text-sm font-medium text-rose-200">
              {TOKEN_ASSUMPTIONS.throwawayPython.label}
            </h3>
            <p className="mt-3 font-mono text-3xl font-semibold text-rose-300">
              {TOKEN_ASSUMPTIONS.throwawayPython.totalTokens.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-[#8b8b9e]">
              tokens/chart ({pyIn.toLocaleString()} in ·{" "}
              {pyOut.toLocaleString()} out)
            </p>
          </div>
          <div className="gradient-border rounded-2xl p-6">
            <h3 className="text-sm font-medium text-emerald-200">
              {TOKEN_ASSUMPTIONS.graphMyAnything.label}
            </h3>
            <p className="mt-3 font-mono text-3xl font-semibold gradient-text">
              {TOKEN_ASSUMPTIONS.graphMyAnything.totalTokens}
            </p>
            <p className="mt-1 text-sm text-[#8b8b9e]">
              tokens/chart ({gmaIn} in · {gmaOut} out)
            </p>
          </div>
        </div>

        <div className="glass mt-8 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-[#f4f4f7]">
            Cost per chart (API list price)
          </h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-xs text-[#8b8b9e]">
                  <th className="pb-3 pr-4 font-medium">Model</th>
                  <th className="pb-3 pr-4 font-medium">Throwaway</th>
                  <th className="pb-3 pr-4 font-medium">GMA query</th>
                  <th className="pb-3 pr-4 font-medium">Saved</th>
                  <th className="pb-3 font-medium">%</th>
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
          <h3 className="text-lg font-semibold">Session & month estimate</h3>
          <p className="mt-1 text-sm text-[#8b8b9e]">
            Adjust how many chart queries your agent runs per session.
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
                Sessions per month (optional)
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
                  <p className="mt-2 text-sm text-[#8b8b9e]">
                    {flagship.label} flagship
                  </p>
                  <p className="font-mono text-xl text-[#f4f4f7]">
                    {formatUsd(f.session.perMonth, 2)}
                    <span className="text-sm text-emerald-400"> saved/mo</span>
                  </p>
                  {e && economy ? (
                    <p className="mt-2 text-xs text-[#8b8b9e]">
                      {economy.label}:{" "}
                      <span className="font-mono text-emerald-300">
                        {formatUsd(e.session.perMonth, 2)}/mo
                      </span>
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-[#8b8b9e]">
                    {formatUsd(f.session.perSession, 3)} saved / session
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-[#8b8b9e]">
          Assumptions: {TOKEN_ASSUMPTIONS.throwawayPython.note}{" "}
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
          (checked {PRICING_CHECKED_AT}). Gemini 2.5 Pro/Flash pricing remains on
          Google&apos;s page with deprecation notices.
        </p>
      </div>
    </section>
  );
}