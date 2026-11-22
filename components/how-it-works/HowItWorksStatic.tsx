"use client";

import { useId, useState } from "react";
import { CHART_URL_FULL, INSIGHT_TEXT, METRIC_EVENTS } from "./constants";

export function HowItWorksStatic() {
  const uid = useId().replace(/:/g, "");
  const gradId = `static-grad-${uid}`;
  const [copied, setCopied] = useState(false);

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
    <div className="how-works-static mt-6 space-y-4">
      <div className="gradient-border overflow-hidden rounded-2xl bg-[#08080e] p-4 sm:p-6">
        <svg
          viewBox="0 0 900 380"
          className="h-auto w-full"
          role="img"
          aria-label="Static metric memory dataflow"
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
          <g opacity="0.15">
            {Array.from({ length: 12 }).map((_, i) => (
              <line
                key={`h${i}`}
                x1={0}
                y1={i * 34}
                x2={900}
                y2={i * 34}
                stroke="#fff"
              />
            ))}
          </g>
          {["Claude", "GPT", "Cron"].map((name, i) => (
            <g key={name} transform={`translate(40, ${70 + i * 110})`}>
              <rect
                width={100}
                height={64}
                rx={12}
                fill="#0c0c12"
                stroke="rgba(255,255,255,0.12)"
              />
              <text
                x={50}
                y={28}
                textAnchor="middle"
                fill="#f4f4f7"
                fontSize={12}
                fontWeight={600}
              >
                {name}
              </text>
              <text
                x={50}
                y={48}
                textAnchor="middle"
                fill="#8b5cf6"
                fontSize={10}
                fontFamily="var(--font-geist-mono)"
              >
                track()
              </text>
            </g>
          ))}
          <ellipse
            cx={400}
            cy={190}
            rx={88}
            ry={88}
            fill="rgba(139,92,246,0.12)"
            stroke={`url(#${gradId})`}
            strokeWidth={2}
          />
          <text
            x={400}
            y={178}
            textAnchor="middle"
            fill="#f4f4f7"
            fontSize={13}
            fontWeight={600}
          >
            Metric memory
          </text>
          <text x={400} y={198} textAnchor="middle" fill="#8b8b9e" fontSize={10}>
            STM → LTTB → LTM
          </text>
          <text
            x={400}
            y={218}
            textAnchor="middle"
            fill="#22d3ee"
            fontSize={9}
            fontFamily="var(--font-geist-mono)"
          >
            stripe.mrr
          </text>
          {METRIC_EVENTS.slice(0, 3).map((ev, i) => (
            <text
              key={ev.label}
              x={210 + i * 55}
              y={150 + i * 28}
              fill={ev.color}
              fontSize={9}
              fontFamily="var(--font-geist-mono)"
            >
              {ev.label}
            </text>
          ))}
          <rect
            x={560}
            y={130}
            width={80}
            height={36}
            rx={8}
            fill="#0c0c12"
            stroke="rgba(34,211,238,0.35)"
          />
          <text
            x={600}
            y={153}
            textAnchor="middle"
            fill="#22d3ee"
            fontSize={11}
            fontFamily="var(--font-geist-mono)"
          >
            query
          </text>
          <rect
            x={560}
            y={220}
            width={80}
            height={36}
            rx={8}
            fill="#0c0c12"
            stroke="rgba(52,211,153,0.35)"
          />
          <text
            x={600}
            y={243}
            textAnchor="middle"
            fill="#34d399"
            fontSize={11}
            fontFamily="var(--font-geist-mono)"
          >
            insight
          </text>
          <rect
            x={680}
            y={110}
            width={190}
            height={160}
            rx={14}
            fill="#0c0c12"
            stroke="rgba(52,211,153,0.35)"
          />
          <polyline
            points="700,200 730,175 760,190 790,170 820,185 850,165"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={2.5}
          />
          <text x={775} y={145} textAnchor="middle" fill="#f4f4f7" fontSize={12}>
            Live chart
          </text>
          <rect
            x={600}
            y={68}
            width={170}
            height={28}
            rx={8}
            fill="rgba(52,211,153,0.15)"
            stroke="rgba(52,211,153,0.4)"
          />
          <text x={685} y={86} textAnchor="middle" fill="#34d399" fontSize={10}>
            {INSIGHT_TEXT}
          </text>
        </svg>
        <ChartUrlChip copied={copied} onCopy={copyUrl} />
      </div>
    </div>
  );
}

export function ChartUrlChip({
  copied,
  onCopy,
}: {
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-2 rounded-xl border border-white/[0.1] bg-black/50 p-3 sm:flex-row sm:items-center sm:gap-3">
      <code className="min-w-0 flex-1 break-all font-mono text-[10px] leading-snug text-cyan-300/90 sm:text-xs">
        {CHART_URL_FULL}
      </code>
      <button
        type="button"
        onClick={onCopy}
        className="shrink-0 rounded-lg bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-[#f4f4f7] ring-1 ring-white/[0.12] hover:bg-white/[0.12]"
      >
        {copied ? "Copied" : "Copy URL"}
      </button>
    </div>
  );
}