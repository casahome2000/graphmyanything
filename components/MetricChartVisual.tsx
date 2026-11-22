"use client";

import { useEffect, useId, useMemo, useState } from "react";

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
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${scaleX(p.x).toFixed(2)} ${scaleY(p.y).toFixed(2)}`,
    )
    .join(" ");
}

function buildArea(
  pathD: string,
  width: number,
  height: number,
  pad: number,
): string {
  const last = pathD.match(/L ([\d.]+) ([\d.]+)$/);
  const first = pathD.match(/M ([\d.]+) ([\d.]+)/);
  if (!last || !first) return "";
  const bottom = height - pad;
  return `${pathD} L ${last[1]} ${bottom} L ${first[1]} ${bottom} Z`;
}

export type MetricChartVariant = "hero" | "full";

type Props = {
  variant?: MetricChartVariant;
  showUrl?: boolean;
  className?: string;
};

export function MetricChartVisual({
  variant = "full",
  showUrl = true,
  className = "",
}: Props) {
  const uid = useId().replace(/:/g, "");
  const lineGradId = `lineGrad-${uid}`;
  const areaGradId = `areaGrad-${uid}`;

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

  const w = variant === "hero" ? 480 : 560;
  const h = variant === "hero" ? 180 : 220;
  const pad = variant === "hero" ? 20 : 24;
  const linePath = buildPath(historical, w, h, pad);
  const forecastPath = buildPath(forecast, w, h, pad);
  const areaPath = buildArea(linePath, w, h, pad);
  const latest = historical[historical.length - 1]?.y ?? 0;

  const shellClass =
    variant === "hero"
      ? "gradient-border overflow-hidden rounded-2xl p-3 sm:p-4"
      : "gradient-border animate-float overflow-hidden rounded-2xl p-4 sm:p-6";

  return (
    <div className={`${shellClass} ${className}`}>
      {showUrl && variant === "full" ? (
        <code className="mb-4 block break-all rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 font-mono text-[11px] text-cyan-300/90 sm:text-xs lg:hidden">
          {CHART_URL}
        </code>
      ) : null}
      <div
        className={`mb-3 flex flex-wrap items-center justify-between gap-2 ${variant === "hero" ? "text-xs" : "text-sm"}`}
      >
        <div>
          <span className="text-[#8b8b9e]">stripe.mrr</span>
          <span
            className={`ml-2 font-mono text-[#f4f4f7] ${variant === "hero" ? "text-base" : "text-lg"}`}
          >
            ${latest.toFixed(1)}k
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#8b8b9e] sm:gap-3 sm:text-xs">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            90d
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full border border-dashed border-cyan-400 bg-cyan-400/70" />
            +30d
          </span>
          <span className="text-emerald-400">+12.4%</span>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full"
        role="img"
        aria-label="Animated sample MRR line chart with forecast"
      >
        <defs>
          <linearGradient id={lineGradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
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
        <path d={areaPath} fill={`url(#${areaGradId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={`url(#${lineGradId})`}
          strokeWidth={variant === "hero" ? 2 : 2.5}
          strokeLinecap="round"
          className={variant === "full" ? "animate-draw" : undefined}
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
          cy={pad + 16}
          r="4"
          fill="#34d399"
          className="animate-pulse-glow"
        />
      </svg>
      {variant === "hero" ? (
        <p className="mt-3 truncate font-mono text-[10px] text-cyan-300/70">
          {CHART_URL}
        </p>
      ) : null}
    </div>
  );
}