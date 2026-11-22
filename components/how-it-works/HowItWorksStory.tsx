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

function beatOpacity(activeBeat: StoryBeat, cardBeat: StoryBeat) {
  if (activeBeat === cardBeat) return 1;
  if (activeBeat > cardBeat) return 0.62;
  return 0.38;
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
  vertical,
  gradId,
}: {
  active: boolean;
  cometOn: boolean;
  vertical: boolean;
  gradId: string;
}) {
  if (vertical) {
    return (
      <div
        className="how-story-connector flex justify-center py-1 sm:py-2 lg:hidden"
        aria-hidden
      >
        <svg width={2} height={40} className="overflow-visible">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={active ? 0.9 : 0.35} />
              <stop offset="50%" stopColor="#22d3ee" stopOpacity={active ? 0.85 : 0.3} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={active ? 0.8 : 0.28} />
            </linearGradient>
            <filter id={`${gradId}-glow`}>
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <line x1={1} y1={0} x2={1} y2={40} stroke={`url(#${gradId})`} strokeWidth={1} />
          {cometOn ? (
            <circle
              key={cometOn ? "comet-on" : "comet-off"}
              className="how-story-comet-v"
              r={3}
              fill="#22d3ee"
              filter={`url(#${gradId}-glow)`}
            >
              <animateMotion
                dur="0.65s"
                repeatCount="1"
                keyPoints="0;1"
                keyTimes="0;1"
                calcMode="spline"
                keySplines="0.22 1 0.36 1"
              >
                <mpath href={`#${gradId}-path-v`} />
              </animateMotion>
            </circle>
          ) : null}
          <path id={`${gradId}-path-v`} d="M 1,0 L 1,40" fill="none" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className="how-story-connector hidden min-w-[28px] flex-1 items-center lg:flex"
      aria-hidden
    >
      <svg
        width="100%"
        height={12}
        viewBox="0 0 120 12"
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={active ? 0.95 : 0.35} />
            <stop offset="50%" stopColor="#22d3ee" stopOpacity={active ? 0.9 : 0.32} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={active ? 0.85 : 0.3} />
          </linearGradient>
          <filter id="comet-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <line x1={0} y1={6} x2={120} y2={6} stroke={`url(#${gradId})`} strokeWidth={1} />
        {cometOn ? (
          <g className="how-story-comet-h">
            <circle key={cometOn ? "comet-on" : "comet-off"} r={3.5} fill="#a5f3fc">
              <animateMotion
                dur="0.7s"
                repeatCount="1"
                path="M 0,6 L 120,6"
                calcMode="spline"
                keyTimes="0;1"
                keySplines="0.22 1 0.36 1"
              />
            </circle>
          </g>
        ) : null}
      </svg>
    </div>
  );
}

function StoryCard({
  title,
  beat,
  activeBeat,
  children,
}: {
  title: string;
  beat: StoryBeat;
  activeBeat: StoryBeat;
  children: React.ReactNode;
}) {
  const lit = activeBeat === beat;
  const opacity = beatOpacity(activeBeat, beat);
  return (
    <article
      className="how-story-card relative flex min-h-[200px] flex-1 flex-col rounded-2xl border border-white/[0.08] bg-[rgba(10,10,16,0.88)] p-3.5 shadow-lg backdrop-blur-md sm:min-h-[220px] sm:p-4 lg:min-w-0"
      data-active={lit ? "true" : "false"}
      style={{
        opacity,
        transform: lit ? "scale(1)" : "scale(0.985)",
        transition: `opacity 0.55s ${EASE}, transform 0.55s ${EASE}, box-shadow 0.55s ${EASE}, border-color 0.55s ${EASE}`,
        boxShadow: lit
          ? "0 0 0 1px rgba(139,92,246,0.22), 0 12px 40px -12px rgba(139,92,246,0.35), inset 0 1px 0 rgba(255,255,255,0.06)"
          : "inset 0 1px 0 rgba(255,255,255,0.04)",
        borderColor: lit ? "rgba(139,92,246,0.35)" : "rgba(255,255,255,0.08)",
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b8b9e]">
        {title}
      </p>
      <div className="mt-2.5 flex flex-1 flex-col">{children}</div>
    </article>
  );
}

function AgentBeat({ progress }: { progress: number }) {
  const len = typewriterLength(progress, AGENT_LINE);
  const showChip = progress > 0.78;

  return (
    <>
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
    </>
  );
}

function MemoryBeat({ progress, cycle }: { progress: number; cycle: number }) {
  const bars = 6;
  const compact = progress > 0.62;
  const showTag = progress > 0.58 && progress < 0.92;

  return (
    <>
      <p className="font-mono text-xs text-violet-300/90">stripe.mrr</p>
      <MotionRow label="Short-term" className="mt-3">
        <div className="flex h-9 items-end gap-1 overflow-hidden" key={`stm-${cycle}`}>
          {Array.from({ length: bars }).map((_, i) => {
            const delay = i * 0.08;
            const inView = progress > 0.12 + delay;
            const h = 30 + (i % 3) * 8 + Math.sin(i * 1.2) * 4;
            return (
              <div
                key={i}
                className="w-2 rounded-sm bg-gradient-to-t from-violet-600/80 to-cyan-400/90"
                style={{
                  height: compact ? 4 : inView ? h : 0,
                  opacity: compact ? 0.35 : inView ? 1 : 0,
                  transform: inView && !compact ? "translateX(0)" : "translateX(12px)",
                  transition: `height 0.55s ${EASE}, opacity 0.45s ${EASE}, transform 0.5s ${EASE}`,
                  transitionDelay: `${delay * 0.5}s`,
                }}
              />
            );
          })}
        </div>
      </MotionRow>
      <MotionRow label="Long-term" className="mt-2.5">
        <MemorySparkline pulse={compact} />
      </MotionRow>
      <MotionChip show={showTag} className="mt-2 border-cyan-500/20 bg-cyan-500/10 text-cyan-200/90">
        LTTB compact
      </MotionChip>
    </>
  );
}

function MemorySparkline({ pulse }: { pulse: boolean }) {
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
    <svg viewBox="0 0 200 36" className="h-9 w-full" aria-hidden>
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
        strokeWidth={1.5}
        strokeLinecap="round"
        style={{
          opacity: pulse ? 1 : 0.85,
          filter: pulse ? "drop-shadow(0 0 6px rgba(34,211,238,0.45))" : undefined,
          transition: `opacity 0.4s ${EASE}`,
        }}
      />
    </svg>
  );
}

function QueryBeat({ progress }: { progress: number }) {
  const len = typewriterLength(progress, QUERY_LINE, 0.06, 0.55);
  const showJson = progress > 0.52;
  const showInsight = progress > 0.72;
  const insightPop = showInsight ? Math.min(1, (progress - 0.72) / 0.2) : 0;
  const spring = 1 + Math.sin(insightPop * Math.PI) * 0.06 * (1 - insightPop);

  return (
    <>
      <MotionTerminal>
        <SyntaxGmaLine
          visibleLen={len}
          variant="query"
          done={len >= QUERY_LINE.length}
        />
      </MotionTerminal>
      <pre
        className="mt-2.5 overflow-hidden rounded-lg border border-white/[0.06] bg-black/30 px-2.5 py-2 font-mono text-[10px] leading-relaxed text-white/70 sm:text-[11px]"
        style={{
          opacity: showJson ? 1 : 0,
          maxHeight: showJson ? 80 : 0,
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
    </>
  );
}

function ChartBeat({
  progress,
  cycle,
  areaGradId,
  lineGradId,
}: {
  progress: number;
  cycle: number;
  areaGradId: string;
  lineGradId: string;
}) {
  const [copied, setCopied] = useState(false);
  const series = useMemo(() => buildMrrSeries(48), []);
  const { linePath, areaPath, lastPoint, ticks } = useMemo(() => {
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
    const tickYs = [0.25, 0.5, 0.75].map(
      (t) => h - pad - t * (h - pad * 2),
    );
    return { linePath, areaPath, lastPoint: last, ticks: tickYs };
  }, [series]);

  const drawT = Math.min(1, Math.max(0, (progress - 0.05) / 0.55));
  const showBadge = progress > 0.42;
  const pulse = progress > 0.58 && progress < 0.78;
  const showUrl = progress > 0.72;

  const pathLen = 520;

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
    <>
      <MotionRow label="Live chart">
        <svg
          key={`chart-${cycle}`}
          viewBox="0 0 280 100"
          className="h-[100px] w-full"
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
              x1={8}
              y1={y}
              x2={272}
              y2={y}
              stroke="rgba(255,255,255,0.06)"
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
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={pathLen}
            strokeDashoffset={pathLen * (1 - drawT)}
            style={{ transition: `stroke-dashoffset 0.05s linear` }}
          />
          {drawT > 0.85 ? (
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r={pulse ? 5.5 : 3.5}
              fill="#34d399"
              style={{
                transition: `r 0.35s ${EASE}`,
                filter: pulse
                  ? "drop-shadow(0 0 8px rgba(52,211,153,0.75))"
                  : undefined,
              }}
            />
          ) : null}
        </svg>
      </MotionRow>
      <div
        className="mt-1 flex items-center justify-between gap-2"
        style={{
          opacity: showBadge ? 1 : 0,
          transform: showBadge ? "translateY(0)" : "translateY(4px)",
          transition: `opacity 0.45s ${EASE}, transform 0.45s ${EASE}`,
        }}
      >
        <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[11px] text-emerald-300/95">
          $12.4k <span className="text-white/50">↑</span>18%
        </span>
      </div>
      <MotionChip
        show={showUrl}
        className="mt-2 flex w-full flex-wrap items-center justify-between gap-2 border-white/10 bg-black/25 text-[10px] sm:text-[11px]"
      >
        <span className="truncate font-mono text-cyan-300/90">{CHART_URL_DISPLAY}</span>
        <button
          type="button"
          onClick={() => void copyUrl()}
          className="shrink-0 rounded-md border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-white/90 transition hover:bg-white/10"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </MotionChip>
    </>
  );
}

function MotionTerminal({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-black/40 px-2.5 py-2 font-mono text-[10px] leading-relaxed sm:text-[11px]">
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
    <span className="how-story-caret ml-0.5 inline-block h-3.5 w-px animate-pulse bg-cyan-400/80" />
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
      className="how-works-anim how-it-works-motion gradient-border mt-8 overflow-hidden rounded-2xl bg-[#07070c]/80 p-3 sm:p-4"
      aria-live="off"
      data-playing={playing ? "true" : "false"}
      data-beat={beat}
    >
      <div className="flex flex-col gap-0 lg:flex-row lg:items-stretch">
        <StoryCard title="1 · Agent" beat={0} activeBeat={beat}>
          <AgentBeat progress={beat === 0 ? beatProgress : beat > 0 ? 1 : 0} />
        </StoryCard>
        <BeatConnector
          active={beat >= 1}
          cometOn={cometWindow(0)}
          vertical={false}
          gradId={`${uid}-c0`}
        />
        <BeatConnector
          active={beat >= 1}
          cometOn={cometWindow(0)}
          vertical
          gradId={`${uid}-c0v`}
        />
        <StoryCard title="2 · Memory" beat={1} activeBeat={beat}>
          <MemoryBeat
            progress={beat === 1 ? beatProgress : beat > 1 ? 1 : 0}
            cycle={cycle}
          />
        </StoryCard>
        <BeatConnector
          active={beat >= 2}
          cometOn={cometWindow(1)}
          vertical={false}
          gradId={`${uid}-c1`}
        />
        <BeatConnector
          active={beat >= 2}
          cometOn={cometWindow(1)}
          vertical
          gradId={`${uid}-c1v`}
        />
        <StoryCard title="3 · Query" beat={2} activeBeat={beat}>
          <QueryBeat progress={beat === 2 ? beatProgress : beat > 2 ? 1 : 0} />
        </StoryCard>
        <BeatConnector
          active={beat >= 3}
          cometOn={cometWindow(2)}
          vertical={false}
          gradId={`${uid}-c2`}
        />
        <BeatConnector
          active={beat >= 3}
          cometOn={cometWindow(2)}
          vertical
          gradId={`${uid}-c2v`}
        />
        <StoryCard title="4 · Chart" beat={3} activeBeat={beat}>
          <ChartBeat
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