"use client";

import { useId, useMemo, useState } from "react";
import {
  AGENT_LINE,
  buildMrrSeries,
  CHART_URL_DISPLAY,
  CHART_URL_FULL,
  QUERY_LINE,
} from "./story-data";

function StaticCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="flex min-h-[200px] flex-1 flex-col rounded-2xl border border-white/[0.12] bg-[rgba(10,10,16,0.92)] p-3.5 shadow-lg sm:p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b8b9e]">
        {title}
      </p>
      <div className="mt-2.5 flex flex-1 flex-col">{children}</div>
    </article>
  );
}

export function HowItWorksStatic() {
  const uid = useId().replace(/:/g, "");
  const lineGradId = `static-line-${uid}`;
  const areaGradId = `static-area-${uid}`;
  const [copied, setCopied] = useState(false);

  const chart = useMemo(() => {
    const series = buildMrrSeries(48);
    const w = 280;
    const h = 100;
    const pad = 8;
    const min = Math.min(...series);
    const max = Math.max(...series);
    const points = series.map((v, i) => ({
      x: pad + (i / (series.length - 1)) * (w - pad * 2),
      y: h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2),
    }));
    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(" ");
    const last = points[points.length - 1];
    const first = points[0];
    const areaPath = `${linePath} L${last.x.toFixed(2)},${h - pad} L${first.x.toFixed(2)},${h - pad} Z`;
    return { linePath, areaPath, last, w, h, pad };
  }, []);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(CHART_URL_FULL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  }

  return (
    <div
      className="how-works-static mt-8"
      role="img"
      aria-label="How GraphMyAnything works: track metrics, compact memory, query with a token budget, live chart URL"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:gap-3">
        <StaticCard title="1 · Agent">
          <StaticPre>{AGENT_LINE}</StaticPre>
          <span className="mt-3 inline-flex rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-200/95">
            sent ✓ 42 tokens
          </span>
        </StaticCard>
        <StaticCard title="2 · Memory">
          <p className="font-mono text-xs text-violet-300/90">stripe.mrr</p>
          <p className="mt-3 text-[9px] uppercase tracking-wider text-[#6b6b7e]">
            Short-term
          </p>
          <div className="mt-1 flex h-9 items-end gap-1">
            {[26, 34, 30, 38, 28, 36].map((h, i) => (
              <div
                key={i}
                className="w-2 rounded-sm bg-gradient-to-t from-violet-600/70 to-cyan-400/80"
                style={{ height: h }}
              />
            ))}
          </div>
          <p className="mt-2 text-[9px] uppercase tracking-wider text-[#6b6b7e]">
            Long-term
          </p>
          <svg viewBox="0 0 200 36" className="mt-1 h-9 w-full" aria-hidden>
            <path
              d="M0,28 L20,26 L40,24 L60,22 L80,20 L100,18 L120,16 L140,14 L160,12 L180,10 L200,8"
              fill="none"
              stroke="url(#static-spark)"
              strokeWidth={1.5}
            />
            <defs>
              <linearGradient id="static-spark" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
          </svg>
        </StaticCard>
        <StaticCard title="3 · Query">
          <pre className="rounded-lg border border-white/[0.07] bg-black/40 px-2.5 py-2 font-mono text-[10px] text-white/80 sm:text-[11px]">
            {QUERY_LINE}
          </pre>
          <pre className="mt-2 rounded-lg border border-white/[0.06] bg-black/30 px-2.5 py-2 font-mono text-[10px] text-white/70">
            {`{\n  "trend": "+18% WoW",\n  "points": 48\n}`}
          </pre>
          <span className="mt-2 inline-flex rounded-full border border-violet-500/30 bg-violet-500/15 px-2.5 py-1 text-[10px] font-medium text-violet-100">
            MRR up 18% WoW
          </span>
        </StaticCard>
        <StaticCard title="4 · Chart">
          <svg
            viewBox={`0 0 ${chart.w} ${chart.h}`}
            className="h-[100px] w-full"
            aria-hidden
          >
            <defs>
              <linearGradient id={lineGradId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="55%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
              <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((t, i) => {
              const y =
                chart.h -
                chart.pad -
                t * (chart.h - chart.pad * 2);
              return (
                <line
                  key={i}
                  x1={chart.pad}
                  y1={y}
                  x2={chart.w - chart.pad}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                />
              );
            })}
            <path d={chart.areaPath} fill={`url(#${areaGradId})`} />
            <path
              d={chart.linePath}
              fill="none"
              stroke={`url(#${lineGradId})`}
              strokeWidth={2}
            />
            <circle
              cx={chart.last.x}
              cy={chart.last.y}
              r={3.5}
              fill="#34d399"
            />
          </svg>
          <span className="mt-1 inline-flex rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[11px] text-emerald-300/95">
            $12.4k ↑18%
          </span>
          <div className="mt-2 flex w-full flex-wrap items-center justify-between gap-2 rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px]">
            <span className="truncate font-mono text-cyan-300/90">
              {CHART_URL_DISPLAY}
            </span>
            <button
              type="button"
              onClick={() => void copyUrl()}
              className="shrink-0 rounded-md border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </StaticCard>
      </div>
    </div>
  );
}

function StaticPre({ children }: { children: React.ReactNode }) {
  return (
    <pre className="rounded-lg border border-white/[0.07] bg-black/40 px-2.5 py-2 font-mono text-[10px] text-white/80 sm:text-[11px]">
      {children}
    </pre>
  );
}