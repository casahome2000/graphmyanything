"use client";

import { useId, useMemo, useRef, useState } from "react";
import {
  AGENT_LINE,
  buildMrrSeries,
  CHART_URL_DISPLAY,
  CHART_URL_FULL,
  QUERY_LINE,
} from "./story-data";
import { type StoryBeat, useStoryTimeline } from "./useStoryTimeline";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function typewriterLength(progress: number, text: string, start = 0.08, end = 0.72) {
  if (progress <= start) return 0;
  if (progress >= end) return text.length;
  const t = (progress - start) / (end - start);
  return Math.floor(t * text.length);
}

type BeatPhase = "ghost" | "active" | "complete";

function getBeatPhase(activeBeat: StoryBeat, cardBeat: StoryBeat): BeatPhase {
  if (activeBeat > cardBeat) return "complete";
  if (activeBeat === cardBeat) return "active";
  return "ghost";
}

function beatCardOpacity(phase: BeatPhase) {
  if (phase === "active") return 1;
  if (phase === "complete") return 0.78;
  return 0.9;
}

function BeatContent({
  phase,
  children,
}: {
  phase: BeatPhase;
  children: React.ReactNode;
}) {
  const ghost = phase === "ghost";
  return (
    <div
      className="flex flex-col"
      style={{
        opacity: ghost ? 0.45 : 1,
        transition: `opacity 0.55s ${EASE}`,
      }}
    >
      {children}
    </div>
  );
}

type GmaVariant = "track" | "query";

const GMA_SEGMENTS: Record<GmaVariant, { text: string; className: string }[]> = {
  track: [
    { text: "gma", className: "text-violet-300/90" },
    { text: ".", className: "text-white/50" },
    { text: "track", className: "text-cyan-300/95" },
    { text: "(", className: "text-white/45" },
    { text: '"stripe.mrr"', className: "text-emerald-300/90" },
    { text: ", ", className: "text-white/45" },
    { text: "12400", className: "text-amber-200/90" },
    { text: ")", className: "text-white/45" },
  ],
  query: [
    { text: "gma", className: "text-violet-300/90" },
    { text: ".", className: "text-white/50" },
    { text: "query", className: "text-cyan-300/95" },
    { text: "(", className: "text-white/45" },
    { text: '"stripe.mrr"', className: "text-emerald-300/90" },
    { text: ", ", className: "text-white/45" },
    { text: "token_budget=200", className: "text-amber-200/85" },
    { text: ")", className: "text-white/45" },
  ],
};

function SyntaxGmaLine({
  visibleLen,
  variant,
  done,
}: {
  visibleLen: number;
  variant: GmaVariant;
  done: boolean;
}) {
  let remaining = visibleLen;
  const segments = GMA_SEGMENTS[variant];
  return (
    <span className="inline">
      {segments.map((seg, i) => {
        if (remaining <= 0) return null;
        const take = Math.min(remaining, seg.text.length);
        remaining -= take;
        return (
          <span key={i} className={seg.className}>
            {seg.text.slice(0, take)}
          </span>
        );
      })}
      {!done ? <Caret /> : null}
    </span>
  );
}

function BeatConnector({
  active,
  cometOn,
  gradId,
}: {
  active: boolean;
  cometOn: boolean;
  gradId: string;
}) {
  const lineOpacity = active ? 1 : 0.72;

  return (
    <>
      <div
        className="how-story-connector flex h-6 items-center justify-center lg:hidden"
        aria-hidden
      >
        <svg width={20} height={24} viewBox="0 0 20 24" className="overflow-visible">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={lineOpacity} />
              <stop offset="50%" stopColor="#22d3ee" stopOpacity={lineOpacity} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={lineOpacity} />
            </linearGradient>
            <filter id={`${gradId}-glow`}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx={10} cy={2} r={2.5} fill="#8b5cf6" opacity={lineOpacity} />
          <line
            x1={10}
            y1={3}
            x2={10}
            y2={19}
            stroke={`url(#${gradId})`}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <polygon
            points="10,22 6,18 14,18"
            fill="#34d399"
            opacity={lineOpacity}
          />
          {cometOn ? (
            <g key="comet-v" filter={`url(#${gradId}-glow)`}>
              <circle r={5} fill="#22d3ee" opacity={0.35} />
              <circle r={3.5} fill="#ecfafe">
                <animateMotion
                  dur="0.72s"
                  repeatCount="1"
                  path="M 10,4 L 10,20"
                  calcMode="spline"
                  keyTimes="0;1"
                  keySplines="0.22 1 0.36 1"
                />
              </circle>
            </g>
          ) : null}
        </svg>
      </div>
      <div
        className="how-story-connector hidden w-8 shrink-0 items-center justify-self-center lg:flex"
        aria-hidden
      >
      <svg
        width={32}
        height={20}
        viewBox="0 0 32 20"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={lineOpacity} />
            <stop offset="50%" stopColor="#22d3ee" stopOpacity={lineOpacity} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={lineOpacity} />
          </linearGradient>
          <filter id={`${gradId}-glow`}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={2} cy={10} r={2.5} fill="#8b5cf6" opacity={lineOpacity} />
        <line
          x1={3}
          y1={10}
          x2={26}
          y2={10}
          stroke={`url(#${gradId})`}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <polygon
          points="30,10 24,6.5 24,13.5"
          fill="#34d399"
          opacity={lineOpacity}
        />
        {cometOn ? (
          <g key="comet-h" filter={`url(#${gradId}-glow)`}>
            <circle r={6} fill="#22d3ee" opacity={0.28} />
            <circle r={4} fill="#e0f2fe">
              <animateMotion
                dur="0.75s"
                repeatCount="1"
                path="M 4,10 L 26,10"
                calcMode="spline"
                keyTimes="0;1"
                keySplines="0.22 1 0.36 1"
              />
            </circle>
          </g>
        ) : null}
      </svg>
    </div>
    </>
  );
}

function StoryCard({
  title,
  phase,
  children,
}: {
  title: string;
  phase: BeatPhase;
  children: React.ReactNode;
}) {
  const lit = phase === "active";
  const opacity = beatCardOpacity(phase);
  return (
    <article
      className="how-story-card relative flex min-h-0 flex-col rounded-2xl border border-white/[0.1] bg-[rgba(10,10,16,0.92)] p-3.5 shadow-lg backdrop-blur-md sm:p-4 lg:min-h-[280px]"
      data-active={lit ? "true" : "false"}
      style={{
        opacity,
        transform: lit ? "scale(1)" : "scale(0.99)",
        transition: `opacity 0.55s ${EASE}, transform 0.55s ${EASE}, box-shadow 0.55s ${EASE}, border-color 0.55s ${EASE}`,
        boxShadow: lit
          ? "0 0 0 1px rgba(139,92,246,0.28), 0 16px 48px -16px rgba(139,92,246,0.45), inset 0 1px 0 rgba(255,255,255,0.08)"
          : "inset 0 1px 0 rgba(255,255,255,0.05)",
        borderColor: lit ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.1)",
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b8b9e]">
        {title}
      </p>
      <div className="mt-2.5">{children}</div>
    </article>
  );
}

function AgentBeat({
  phase,
  progress,
}: {
  phase: BeatPhase;
  progress: number;
}) {
  const isGhost = phase === "ghost";
  const isComplete = phase === "complete";
  const len =
    isGhost || isComplete
      ? AGENT_LINE.length
      : typewriterLength(progress, AGENT_LINE);
  const showChip =
    isGhost || isComplete || progress > 0.78;

  return (
    <BeatContent phase={phase}>
      <MotionTerminal>
        <SyntaxGmaLine
          visibleLen={len}
          variant="track"
          done={len >= AGENT_LINE.length}
        />
      </MotionTerminal>
      <MotionChip
        show={showChip}
        className="mt-3 border-emerald-500/25 bg-emerald-500/10 text-emerald-200/95"
      >
        sent ✓ 42 tokens
      </MotionChip>
    </BeatContent>
  );
}

function MemoryBeat({
  phase,
  progress,
  cycle,
}: {
  phase: BeatPhase;
  progress: number;
  cycle: number;
}) {
  const bars = 10;
  const isGhost = phase === "ghost";
  const isComplete = phase === "complete";
  const compactPhase = progress > 0.58 && progress < 0.88;
  const compacted = progress >= 0.88 || isComplete;
  const showTag =
    isGhost || compactPhase || compacted || isComplete;

  const heights = useMemo(
    () =>
      Array.from({ length: bars }, (_, i) => {
        const base = 18 + (i % 4) * 7 + Math.sin(i * 1.35) * 5;
        return Math.round(base);
      }),
    [],
  );

  return (
    <BeatContent phase={phase}>
      <p className="font-mono text-xs text-violet-300/90">stripe.mrr</p>
      <MotionRow label="Short-term" className="mt-2">
        <div
          className="flex h-14 items-end gap-[3px] overflow-hidden rounded-md border border-white/[0.05] bg-black/25 px-1.5 py-1.5"
          key={`stm-${cycle}`}
        >
          {heights.map((h, i) => {
            const delay = i * 0.06;
            const inView = isGhost || isComplete || progress > 0.1 + delay;
            const squeezing = !isGhost && compactPhase;
            const squeezed = compacted && !isGhost;
            return (
              <div
                key={i}
                className="min-w-[6px] flex-1 rounded-[3px] bg-gradient-to-t from-violet-600/90 to-cyan-400/95 shadow-[0_0_8px_rgba(34,211,238,0.25)]"
                style={{
                  height: squeezed
                    ? 3
                    : squeezing
                      ? Math.max(4, h * (1 - (progress - 0.58) * 2.2))
                      : inView
                        ? `${h}px`
                        : 0,
                  opacity: inView ? (squeezed ? 0.4 : 1) : 0,
                  transform:
                    squeezing || squeezed
                      ? `translateX(${squeezed ? 18 - i * 1.2 : (progress - 0.58) * 14}px) scaleY(${squeezed ? 0.15 : 1})`
                      : inView
                        ? "translateX(0)"
                        : "translateX(10px)",
                  transformOrigin: "bottom center",
                  transition: `height 0.5s ${EASE}, opacity 0.45s ${EASE}, transform 0.55s ${EASE}`,
                  transitionDelay: isGhost ? "0s" : `${delay * 0.35}s`,
                }}
              />
            );
          })}
        </div>
      </MotionRow>
      <MotionRow label="Long-term" className="mt-2">
        <MemorySparkline pulse={compactPhase || compacted || isGhost} boost={compacted} />
      </MotionRow>
      <MotionChip
        show={showTag}
        className="mt-2 border-cyan-500/25 bg-cyan-500/12 text-cyan-100"
      >
        LTTB compact
      </MotionChip>
    </BeatContent>
  );
}

function MemorySparkline({ pulse, boost }: { pulse: boolean; boost?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const gradId = `mem-spark-${uid}`;
  const path = useMemo(() => {
    const w = 200;
    const h = 36;
    const pts = buildMrrSeries(32);
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    return pts
      .map((v, i) => {
        const x = (i / (pts.length - 1)) * w;
        const y = h - 4 - ((v - min) / (max - min || 1)) * (h - 8);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, []);

  return (
    <svg viewBox="0 0 200 36" className="h-10 w-full" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={1.75}
        strokeLinecap="round"
        style={{
          opacity: boost ? 1 : pulse ? 0.95 : 0.8,
          filter: boost
            ? "drop-shadow(0 0 10px rgba(52,211,153,0.55))"
            : pulse
              ? "drop-shadow(0 0 6px rgba(34,211,238,0.45))"
              : undefined,
          transition: `opacity 0.45s ${EASE}, filter 0.5s ${EASE}`,
        }}
      />
    </svg>
  );
}

function QueryBeat({
  phase,
  progress,
}: {
  phase: BeatPhase;
  progress: number;
}) {
  const isGhost = phase === "ghost";
  const isComplete = phase === "complete";
  const len =
    isGhost || isComplete
      ? QUERY_LINE.length
      : typewriterLength(progress, QUERY_LINE, 0.06, 0.55);
  const showJson = isGhost || isComplete || progress > 0.52;
  const showInsight = isGhost || isComplete || progress > 0.72;
  const insightPop =
    isGhost || isComplete
      ? 0.85
      : showInsight
        ? Math.min(1, (progress - 0.72) / 0.2)
        : 0;
  const spring =
    isGhost || isComplete
      ? 1
      : 1 + Math.sin(insightPop * Math.PI) * 0.06 * (1 - insightPop);

  return (
    <BeatContent phase={phase}>
      <MotionTerminal>
        <SyntaxGmaLine
          visibleLen={len}
          variant="query"
          done={len >= QUERY_LINE.length}
        />
      </MotionTerminal>
      <pre
        className="mt-2 overflow-hidden rounded-lg border border-white/[0.06] bg-black/30 px-2.5 py-2 font-mono text-[10px] leading-relaxed text-white/70 sm:text-xs"
        style={{
          opacity: showJson ? 1 : 0,
          maxHeight: showJson ? 88 : 0,
          transition: `opacity 0.45s ${EASE}, max-height 0.5s ${EASE}`,
        }}
      >
        <span className="text-white/40">{"{"}</span>
        {"\n"}
        <span className="text-cyan-300/90">  &quot;trend&quot;</span>
        <span className="text-white/40">: </span>
        <span className="text-emerald-300/95">&quot;+18% WoW&quot;</span>
        <span className="text-white/40">,</span>
        {"\n"}
        <span className="text-cyan-300/90">  &quot;points&quot;</span>
        <span className="text-white/40">: </span>
        <span className="text-amber-200/90">48</span>
        {"\n"}
        <span className="text-white/40">{"}"}</span>
      </pre>
      <MotionChip
        show={showInsight}
        className="mt-2 border-violet-500/30 bg-violet-500/15 text-violet-100"
        style={{
          opacity: insightPop,
          transform: `scale(${spring})`,
        }}
      >
        MRR up 18% WoW
      </MotionChip>
    </BeatContent>
  );
}

function ChartBeat({
  phase,
  progress,
  cycle,
  areaGradId,
  lineGradId,
}: {
  phase: BeatPhase;
  progress: number;
  cycle: number;
  areaGradId: string;
  lineGradId: string;
}) {
  const [copied, setCopied] = useState(false);
  const series = useMemo(() => buildMrrSeries(48), []);
  const isGhost = phase === "ghost";
  const isComplete = phase === "complete";

  const { linePath, areaPath, lastPoint, ticks, w, h, pad } = useMemo(() => {
    const w = 400;
    const h = 142;
    const pad = 10;
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
    const tickYs = [0.25, 0.5, 0.75].map(
      (t) => h - pad - t * (h - pad * 2),
    );
    return { linePath, areaPath, lastPoint: last, ticks: tickYs, w, h, pad };
  }, [series]);

  const drawT =
    isGhost || isComplete
      ? 1
      : Math.min(1, Math.max(0, (progress - 0.05) / 0.55));
  const showBadge = isGhost || isComplete || progress > 0.42;
  const pulse = !isGhost && progress > 0.58 && progress < 0.78;
  const showUrl = isGhost || isComplete || progress > 0.72;

  const pathLen = 860;

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
    <BeatContent phase={phase}>
      <MotionRow label="Live chart">
        <div className="relative w-full">
          <svg
            key={`chart-${cycle}`}
            viewBox={`0 0 ${w} ${h}`}
            className="h-[142px] w-full"
            preserveAspectRatio="none"
            role="img"
            aria-label="Stripe MRR chart rising 18 percent week over week"
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
          {ticks.map((y, i) => (
            <line
              key={i}
              x1={pad}
              y1={y}
              x2={w - pad}
              y2={y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />
          ))}
          <path
            d={areaPath}
            fill={`url(#${areaGradId})`}
            style={{
              opacity: drawT,
              transition: `opacity 0.3s ${EASE}`,
            }}
          />
          <path
            d={linePath}
            fill="none"
            stroke={`url(#${lineGradId})`}
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeDasharray={pathLen}
            strokeDashoffset={pathLen * (1 - drawT)}
            style={{ transition: `stroke-dashoffset 0.05s linear` }}
          />
          {drawT > 0.82 ? (
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r={pulse ? 6.5 : 4}
              fill="#34d399"
              style={{
                transition: `r 0.35s ${EASE}`,
                filter: pulse
                  ? "drop-shadow(0 0 10px rgba(52,211,153,0.85))"
                  : "drop-shadow(0 0 4px rgba(52,211,153,0.45))",
              }}
            />
          ) : null}
          </svg>
          <div
            className="absolute right-1 top-1 rounded-md border border-white/10 bg-black/50 px-2 py-0.5 font-mono text-[10px] text-emerald-300/95 backdrop-blur-sm sm:text-[11px]"
            style={{
              opacity: showBadge ? 1 : 0,
              transform: showBadge ? "translateY(0)" : "translateY(4px)",
              transition: `opacity 0.45s ${EASE}, transform 0.45s ${EASE}`,
            }}
          >
            $12.4k <span className="text-white/50">↑</span>18%
          </div>
        </div>
      </MotionRow>
      <div
        className={`mt-2 flex w-full items-start gap-2 rounded-xl border border-white/10 bg-black/30 px-2.5 py-2 transition-opacity duration-500 ${showUrl ? "opacity-100" : "pointer-events-none opacity-0"}`}
        style={{ transitionTimingFunction: EASE }}
      >
        <span className="min-w-0 flex-1 break-all font-mono text-[9px] leading-snug text-cyan-300/95 sm:text-[10px]">
          {CHART_URL_DISPLAY}
        </span>
        <button
          type="button"
          onClick={() => void copyUrl()}
          className="shrink-0 rounded-md border border-white/15 bg-white/[0.08] px-2.5 py-1 text-[10px] font-medium text-white/95 transition hover:bg-white/12"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </BeatContent>
  );
}

function MotionTerminal({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-black/45 px-2.5 py-2.5 font-mono text-[11px] leading-relaxed sm:text-[13px]">
      {children}
    </div>
  );
}

function motionRow({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <p className="text-[9px] uppercase tracking-wider text-[#6b6b7e]">{label}</p>
      {children}
    </div>
  );
}

function MotionRow({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return motionRow({ label, className, children });
}

function MotionChip({
  show,
  children,
  className = "",
  style,
}: {
  show: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const opacity = show ? (style?.opacity ?? 1) : 0;
  const transform = show
    ? (style?.transform ?? "translateY(0)")
    : "translateY(6px)";
  return (
    <div
      className={`inline-flex w-fit max-w-full items-center rounded-full border px-2.5 py-1 text-[10px] font-medium sm:text-[11px] ${className}`}
      style={{
        ...style,
        opacity,
        transform,
        transition: `opacity 0.5s ${EASE}, transform 0.55s ${EASE}`,
      }}
    >
      {children}
    </div>
  );
}

function Caret() {
  return (
    <span className="how-story-caret ml-0.5 inline-block h-4 w-[2px] bg-cyan-300" />
  );
}

export function HowItWorksStory() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { beat, beatProgress, cycle, playing } = useStoryTimeline(rootRef);
  const uid = useId().replace(/:/g, "");
  const areaGradId = `how-area-${uid}`;
  const lineGradId = `how-line-${uid}`;

  const cometWindow =
    (b: StoryBeat) =>
    beat === b && beatProgress > 0.7 && beatProgress < 0.9;

  return (
    <div
      id="how-it-works-story"
      ref={rootRef}
      className="how-works-anim how-it-works-motion gradient-border relative mt-8 overflow-hidden rounded-2xl bg-[#07070c]/85 p-3 sm:p-4 lg:p-5"
      aria-live="off"
      data-playing={playing ? "true" : "false"}
      data-beat={beat}
    >
      <div className="grid grid-cols-1 gap-y-0 lg:grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)_2rem_minmax(0,1fr)_2rem_minmax(0,1fr)] lg:gap-x-6 lg:gap-y-0">
        <StoryCard title="1 · Agent" phase={getBeatPhase(beat, 0)}>
          <AgentBeat
            phase={getBeatPhase(beat, 0)}
            progress={beat === 0 ? beatProgress : 0}
          />
        </StoryCard>
        <BeatConnector
          active={beat >= 1}
          cometOn={cometWindow(0)}
          gradId={`${uid}-c0`}
        />
        <StoryCard title="2 · Memory" phase={getBeatPhase(beat, 1)}>
          <MemoryBeat
            phase={getBeatPhase(beat, 1)}
            progress={beat === 1 ? beatProgress : 0}
            cycle={cycle}
          />
        </StoryCard>
        <BeatConnector
          active={beat >= 2}
          cometOn={cometWindow(1)}
          gradId={`${uid}-c1`}
        />
        <StoryCard title="3 · Query" phase={getBeatPhase(beat, 2)}>
          <QueryBeat
            phase={getBeatPhase(beat, 2)}
            progress={beat === 2 ? beatProgress : 0}
          />
        </StoryCard>
        <BeatConnector
          active={beat >= 3}
          cometOn={cometWindow(2)}
          gradId={`${uid}-c2`}
        />
        <StoryCard title="4 · Chart" phase={getBeatPhase(beat, 3)}>
          <ChartBeat
            phase={getBeatPhase(beat, 3)}
            progress={beat === 3 ? beatProgress : 0}
            cycle={cycle}
            areaGradId={areaGradId}
            lineGradId={lineGradId}
          />
        </StoryCard>
      </div>
    </div>
  );
}