"use client";

import { useEffect, useMemo, useState } from "react";

const CHART_URL =
  "https://graphmyanything.com/c/stripe.mrr.png?range=90d&type=line&forecast=30d";

function buildPath(
  points: { x: number; y: number }[],
  width: number,
  height: number,
  pad: number,
): string {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scaleX = (x: number) =>
    pad + ((x - minX) / (maxX - minX || 1)) * (width - pad * 2);
  const scaleY = (y: number) =>
    height - pad - ((y - minY) / (maxY - minY || 1)) * (height - pad * 2);
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(p.x).toFixed(2)} ${scaleY(p.y).toFixed(2)}`)
    .join(" ");
}

function buildArea(pathD: string, width: number, height: number, pad: number): string {
  const last = pathD.match(/L ([\d.]+) ([\d.]+)$/);
  const first = pathD.match(/M ([\d.]+) ([\d.]+)/);
  if (!last || !first) return "";
  const bottom = height - pad;
  return `${pathD} L ${last[1]} ${bottom} L ${first[1]} ${bottom} Z`;
}

export function DemoChart() {
  const baseSeries = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < 90; i++) {
      const trend = 42 + i * 0.35;
      const season = Math.sin(i / 8) * 4;
      const noise = Math.sin(i * 2.1) * 1.2;
      pts.push({ x: i, y: trend + season + noise });
    }
    return pts;
  }, []);

  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3200);
    return () => clearInterval(id);
  }, []);

  const animatedSeries = useMemo(() => {
    const bump = Math.sin(tick * 0.7) * 2;
    return baseSeries.map((p, i) => ({
      ...p,
      y: p.y + (i > 75 ? bump + (i - 75) * 0.15 : 0),
    }));
  }, [baseSeries, tick]);

  const forecastStart = 75;
  const historical = animatedSeries.slice(0, forecastStart + 1);
  const forecast = animatedSeries.slice(forecastStart).map((p, i) => ({
    x: p.x + i * 0.3,
    y: p.y + i * 0.55,
  }));

  const w = 560;
  const h = 220;
  const pad = 24;
  const linePath = buildPath(historical, w, h, pad);
  const forecastPath = buildPath(forecast, w, h, pad);
  const areaPath = buildArea(linePath, w, h, pad);

  const latest = historical[historical.length - 1]?.y ?? 0;

  return (
    <section id="demo" className="scroll-mt-20 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Live chart URLs
            </h2>
            <p className="mt-2 max-w-xl text-[#8b8b9e]">
              Permanent, updating charts—Cloudinary-style transforms. Works in
              Slack, email, READMEs, and embeds.
            </p>
          </div>
          <code className="mt-2 break-all rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 font-mono text-[11px] text-cyan-300/90 sm:max-w-md sm:text-xs">
            {CHART_URL}
          </code>
        </div>
        <div className="gradient-border animate-float overflow-hidden rounded-2xl p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <span className="text-[#8b8b9e]">stripe.mrr</span>
              <span className="ml-3 font-mono text-lg text-[#f4f4f7]">
                ${latest.toFixed(1)}k
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#8b8b9e]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-violet-400" />
                90d actual
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400/80 border border-dashed border-cyan-400" />
                30d forecast
              </span>
              <span className="text-emerald-400">+12.4% vs prior</span>
            </div>
          </div>
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="h-auto w-full"
            role="img"
            aria-label="Animated sample MRR line chart with forecast"
          >
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="50%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((f) => (
              <line
                key={f}
                x1={pad}
                x2={w - pad}
                y1={pad + f * (h - pad * 2)}
                y2={pad + f * (h - pad * 2)}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
            ))}
            <path d={areaPath} fill="url(#areaGrad)" />
            <path
              d={linePath}
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="animate-draw"
            />
            <path
              d={forecastPath}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2"
              strokeDasharray="6 5"
              strokeLinecap="round"
              opacity="0.85"
            />
            <circle
              cx={w - pad - 8}
              cy={pad + 20}
              r="4"
              fill="#34d399"
              className="animate-pulse-glow"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}