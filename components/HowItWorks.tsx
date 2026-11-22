"use client";

import { useId } from "react";

const CHART_URL =
  "graphmyanything.com/c/stripe.mrr.png?range=90d";

export function HowItWorks() {
  const uid = useId().replace(/:/g, "");
  const gradId = `flow-grad-${uid}`;
  const glowId = `flow-glow-${uid}`;

  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-y border-white/[0.06] py-16 sm:py-20"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-300/90">
          How it works
        </p>
        <h2
          id="how-it-works-heading"
          className="mt-3 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          Agent writes once. Memory grows. Charts stay live.
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[#8b8b9e] sm:text-base">
          <span className="font-mono text-cyan-300/90">track()</span> feeds
          short-term and long-term namespaces.{" "}
          <span className="font-mono text-violet-300/90">query</span> and{" "}
          <span className="font-mono text-emerald-300/90">insight</span> read
          compact summaries—a permanent chart URL works everywhere.
        </p>

        <div className="gradient-border relative mt-10 overflow-hidden rounded-2xl p-3 sm:p-6">
          <MotionLiveBadge />
          <svg
            viewBox="0 0 720 320"
            className="h-auto w-full"
            role="img"
            aria-label="Diagram: AI agent sends track calls into metric memory, then query and insight produce a live chart URL"
          >
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="50%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
              <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* paths */}
            <path
              id={`path-track-stm-${uid}`}
              d="M 118 118 C 170 118, 200 100, 248 120"
              fill="none"
              stroke="rgba(139,92,246,0.35)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />
            <path
              id={`path-track-ltm-${uid}`}
              d="M 118 202 C 170 202, 200 218, 248 200"
              fill="none"
              stroke="rgba(34,211,238,0.35)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />
            <path
              id={`path-query-${uid}`}
              d="M 408 128 C 460 128, 500 140, 548 152"
              fill="none"
              stroke="rgba(34,211,238,0.4)"
              strokeWidth="2"
            />
            <path
              id={`path-insight-${uid}`}
              d="M 408 192 C 460 192, 500 178, 548 168"
              fill="none"
              stroke="rgba(52,211,153,0.4)"
              strokeWidth="2"
            />

            {/* Agent */}
            <g>
              <rect
                x="24"
                y="118"
                width="94"
                height="84"
                rx="14"
                fill="rgba(12,12,18,0.9)"
                stroke="rgba(255,255,255,0.12)"
              />
              <text
                x="71"
                y="152"
                textAnchor="middle"
                fill="#f4f4f7"
                fontSize="13"
                fontWeight="600"
              >
                AI agent
              </text>
              <text
                x="71"
                y="172"
                textAnchor="middle"
                fill="#8b5cf6"
                fontSize="11"
                fontFamily="var(--font-geist-mono)"
              >
                track()
              </text>
            </g>

            {/* Memory */}
            <g>
              <rect
                x="248"
                y="88"
                width="160"
                height="144"
                rx="16"
                fill="rgba(139,92,246,0.08)"
                stroke={`url(#${gradId})`}
                strokeWidth="1.5"
              />
              <text
                x="328"
                y="114"
                textAnchor="middle"
                fill="#f4f4f7"
                fontSize="13"
                fontWeight="600"
              >
                Metric memory
              </text>
              <rect
                x="264"
                y="126"
                width="128"
                height="40"
                rx="8"
                fill="rgba(34,211,238,0.12)"
                stroke="rgba(34,211,238,0.25)"
              />
              <text x="328" y="150" textAnchor="middle" fill="#8b8b9e" fontSize="10">
                Short-term · recent
              </text>
              <rect
                x="264"
                y="174"
                width="128"
                height="44"
                rx="8"
                fill="rgba(139,92,246,0.12)"
                stroke="rgba(139,92,246,0.25)"
              />
              <text x="328" y="200" textAnchor="middle" fill="#8b8b9e" fontSize="10">
                Long-term · years
              </text>
              <text
                x="328"
                y="218"
                textAnchor="middle"
                fill="#22d3ee"
                fontSize="9"
                fontFamily="var(--font-geist-mono)"
              >
                stripe.mrr
              </text>
            </g>

            {/* MCP out */}
            <g>
              <rect
                x="408"
                y="104"
                width="88"
                height="36"
                rx="8"
                fill="rgba(12,12,18,0.85)"
                stroke="rgba(34,211,238,0.3)"
              />
              <text
                x="452"
                y="128"
                textAnchor="middle"
                fill="#22d3ee"
                fontSize="11"
                fontFamily="var(--font-geist-mono)"
              >
                query
              </text>
              <rect
                x="408"
                y="168"
                width="88"
                height="36"
                rx="8"
                fill="rgba(12,12,18,0.85)"
                stroke="rgba(52,211,153,0.3)"
              />
              <text
                x="452"
                y="192"
                textAnchor="middle"
                fill="#34d399"
                fontSize="11"
                fontFamily="var(--font-geist-mono)"
              >
                insight
              </text>
            </g>

            {/* Chart URL */}
            <g>
              <rect
                x="548"
                y="118"
                width="148"
                height="84"
                rx="14"
                fill="rgba(12,12,18,0.95)"
                stroke="rgba(52,211,153,0.35)"
              />
              <text
                x="622"
                y="148"
                textAnchor="middle"
                fill="#f4f4f7"
                fontSize="12"
                fontWeight="600"
              >
                Live chart
              </text>
              <polyline
                points="572,172 592,158 612,168 632,154 652,162"
                fill="none"
                stroke={`url(#${gradId})`}
                strokeWidth="2"
                strokeLinecap="round"
                className="how-chart-line"
              />
              <text
                x="622"
                y="188"
                textAnchor="middle"
                fill="#8b8b9e"
                fontSize="8"
                fontFamily="var(--font-geist-mono)"
              >
                {CHART_URL.length > 28
                  ? `${CHART_URL.slice(0, 26)}…`
                  : CHART_URL}
              </text>
            </g>

            {/* animated packets — hidden via CSS when reduced motion */}
            <g className="how-it-works-motion">
              <circle r="5" fill="#8b5cf6" filter={`url(#${glowId})`}>
                <animateMotion
                  dur="2.8s"
                  repeatCount="indefinite"
                  path="M 118 118 C 170 118, 200 100, 248 120"
                />
              </circle>
              <circle r="5" fill="#22d3ee" filter={`url(#${glowId})`}>
                <animateMotion
                  dur="3.2s"
                  repeatCount="indefinite"
                  begin="0.6s"
                  path="M 118 202 C 170 202, 200 218, 248 200"
                />
              </circle>
              <circle r="4" fill="#22d3ee">
                <animateMotion
                  dur="2.4s"
                  repeatCount="indefinite"
                  begin="1s"
                  path="M 408 128 C 460 128, 500 140, 548 152"
                />
              </circle>
              <circle r="4" fill="#34d399">
                <animateMotion
                  dur="2.6s"
                  repeatCount="indefinite"
                  begin="1.4s"
                  path="M 408 192 C 460 192, 500 178, 548 168"
                />
              </circle>
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}

function MotionLiveBadge() {
  return (
    <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-black/40 px-2.5 py-1 text-[10px] text-[#8b8b9e]">
      <span className="how-it-works-motion h-1.5 w-1.5 rounded-full bg-emerald-400" />
      Dataflow
    </span>
  );
}