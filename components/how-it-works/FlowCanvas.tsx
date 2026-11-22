"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CHART_URL_FULL, INSIGHT_TEXT, METRIC_EVENTS } from "./constants";
import { ChartUrlChip } from "./HowItWorksStatic";

type Layout = {
  w: number;
  h: number;
  vertical: boolean;
  sources: { x: number; y: number; label: string }[];
  core: { x: number; y: number; r: number };
  query: { x: number; y: number };
  insight: { x: number; y: number };
  chart: { x: number; y: number; w: number; h: number };
};

function getLayout(w: number, h: number): Layout {
  const vertical = w < 640;
  if (vertical) {
    return {
      w,
      h,
      vertical: true,
      sources: [
        { x: w * 0.22, y: h * 0.09, label: "Claude" },
        { x: w * 0.5, y: h * 0.09, label: "GPT" },
        { x: w * 0.78, y: h * 0.09, label: "Cron" },
      ],
      core: { x: w * 0.5, y: h * 0.34, r: Math.min(w * 0.18, 56) },
      query: { x: w * 0.3, y: h * 0.52 },
      insight: { x: w * 0.7, y: h * 0.52 },
      chart: { x: w * 0.06, y: h * 0.62, w: w * 0.88, h: h * 0.32 },
    };
  }
  return {
    w,
    h,
    vertical: false,
    sources: [
      { x: 82, y: 88, label: "Claude" },
      { x: 82, y: 178, label: "GPT" },
      { x: 82, y: 268, label: "Cron" },
    ],
    core: { x: w * 0.36, y: h * 0.5, r: 72 },
    query: { x: w * 0.54, y: h * 0.34 },
    insight: { x: w * 0.54, y: h * 0.66 },
    chart: { x: w * 0.66, y: h * 0.08, w: w * 0.31, h: h * 0.84 },
  };
}

type Particle = {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  t: number;
  speed: number;
  label: string;
  color: string;
  glow: number;
  showLabel: boolean;
  labelAlpha: number;
};

type Beam = {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  t: number;
  color: string;
  width: number;
  kind: "core-query" | "core-insight" | "query-chart" | "insight-chart";
};

type LabelAnchor = { x: number; y: number; until: number };

function inForbiddenLabelZone(
  x: number,
  y: number,
  layout: Layout,
): boolean {
  for (const src of layout.sources) {
    if (
      x > src.x - 58 &&
      x < src.x + 58 &&
      y > src.y - 38 &&
      y < src.y + 38
    ) {
      return true;
    }
  }
  const { core } = layout;
  if (
    x > core.x - core.r - 20 &&
    x < core.x + core.r + 20 &&
    y > core.y - core.r - 42 &&
    y < core.y + core.r + 24
  ) {
    return true;
  }
  return false;
}

function nextMrrValue(index: number): number {
  const trend = 0.18 + index * 0.0125;
  const wobble = Math.sin(index * 0.22) * 0.035 + Math.sin(index * 0.07) * 0.02;
  return Math.min(0.94, Math.max(0.12, trend + wobble));
}

export function FlowCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const runningRef = useRef(true);
  const stateRef = useRef({
    particles: [] as Particle[],
    beams: [] as Beam[],
    labelAnchors: [] as LabelAnchor[],
    stmFill: 0.3,
    lttb: 0,
    corePulse: 1,
    chartPts: [] as number[],
    chartIndex: 0,
    chartPulse: 0,
    insightScale: 0,
    insightAlpha: 0,
    insightVel: 0,
    insightActive: false,
    lastEmit: 0,
    lastBeam: 0,
    lastLttb: 0,
    lastChartTick: 0,
    time: 0,
    parallax: 0,
    burstSeq: 0,
  });

  const copyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CHART_URL_FULL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let raf = 0;
    let layout = getLayout(900, 440);

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = Math.max(rect.width, 320);
      const cssH =
        cssW < 640 ? Math.max(500, cssW * 1.05) : Math.max(400, cssW * 0.5);
      layout = getLayout(cssW, cssH);
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const io = new IntersectionObserver(
      ([entry]) => {
        runningRef.current = entry.isIntersecting;
      },
      { threshold: 0.12 },
    );
    io.observe(container);

    const s0 = stateRef.current;
    for (let i = 0; i < 40; i++) {
      s0.chartPts.push(nextMrrValue(i));
    }
    s0.chartIndex = 40;

    const spawnBurst = (sx: number, sy: number, tx: number, ty: number) => {
      const s = stateRef.current;
      s.burstSeq += 1;
      const n = 3 + Math.floor(Math.random() * 2);
      const ev =
        METRIC_EVENTS[Math.floor(Math.random() * METRIC_EVENTS.length)];
      for (let i = 0; i < n; i++) {
        s.particles.push({
          sx,
          sy,
          tx,
          ty,
          t: -i * 0.08,
          speed: 0.01 + Math.random() * 0.01,
          label: ev.label,
          color: ev.color,
          glow: 0.5 + Math.random() * 0.5,
          showLabel: i === 0,
          labelAlpha: i === 0 ? 1 : 0,
        });
      }
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const curvePoint = (
      sx: number,
      sy: number,
      tx: number,
      ty: number,
      t: number,
    ) => {
      const cx = (sx + tx) / 2 + (ty - sy) * 0.12;
      const cy = (sy + ty) / 2 - (tx - sx) * 0.1;
      const u = 1 - t;
      return {
        x: u * u * sx + 2 * u * t * cx + t * t * tx,
        y: u * u * sy + 2 * u * t * cy + t * t * ty,
      };
    };

    const fireBeams = () => {
      const s = stateRef.current;
      const ch = layout.chart;
      const chartCx = ch.x + ch.w * 0.5;
      const chartTop = ch.y + ch.h * 0.28;
      const chartMid = ch.y + ch.h * 0.55;

      s.beams.push({
        fromX: layout.core.x + layout.core.r * 0.3,
        fromY: layout.core.y,
        toX: layout.query.x,
        toY: layout.query.y,
        t: 0,
        color: "#22d3ee",
        width: 4,
        kind: "core-query",
      });
      s.beams.push({
        fromX: layout.core.x + layout.core.r * 0.3,
        fromY: layout.core.y,
        toX: layout.insight.x,
        toY: layout.insight.y,
        t: 0,
        color: "#34d399",
        width: 4,
        kind: "core-insight",
      });
      s.beams.push({
        fromX: layout.query.x,
        fromY: layout.query.y,
        toX: chartCx,
        toY: chartTop,
        t: 0,
        color: "#22d3ee",
        width: 3,
        kind: "query-chart",
      });
      s.beams.push({
        fromX: layout.insight.x,
        fromY: layout.insight.y,
        toX: chartCx,
        toY: chartMid,
        t: 0.15,
        color: "#34d399",
        width: 3,
        kind: "insight-chart",
      });

      s.insightActive = true;
      s.insightVel = 0.22;
      s.insightAlpha = 1;
    };

    const draw = (ts: number) => {
      raf = requestAnimationFrame(draw);
      if (!runningRef.current) return;

      const s = stateRef.current;
      const dt = Math.min(32, ts - (s.time || ts));
      s.time = ts;
      s.parallax = Math.sin(ts * 0.00035) * 6;
      s.corePulse = 0.9 + Math.sin(ts * 0.0028) * 0.1;

      const maxLabels = layout.vertical ? 2 : 4;

      if (ts - s.lastEmit > 420) {
        s.lastEmit = ts;
        const src =
          layout.sources[Math.floor(Math.random() * layout.sources.length)];
        spawnBurst(src.x, src.y, layout.core.x, layout.core.y);
      }

      if (ts - s.lastBeam > 2200) {
        s.lastBeam = ts;
        fireBeams();
      }

      if (ts - s.lastLttb > 4500) {
        s.lastLttb = ts;
        s.lttb = 1;
        for (let i = 0; i < 8; i++) {
          const a = Math.PI * 0.35 + (i / 8) * Math.PI * 0.45;
          const r = layout.core.r * 0.65;
          stateRef.current.particles.push({
            sx: layout.core.x + Math.cos(a) * r,
            sy: layout.core.y - layout.core.r * 0.18,
            tx: layout.core.x,
            ty: layout.core.y + layout.core.r * 0.45,
            t: 0,
            speed: 0.018,
            label: "compact",
            color: "#34d399",
            glow: 0.8,
            showLabel: false,
            labelAlpha: 0,
          });
        }
      }
      s.lttb = Math.max(0, s.lttb - dt * 0.00028);

      s.stmFill = Math.min(0.92, s.stmFill + dt * 0.00006);
      if (s.lttb > 0.15) s.stmFill = Math.max(0.28, s.stmFill - dt * 0.00045);

      s.particles = s.particles.filter((p) => {
        p.t += p.speed * (dt / 16);
        if (p.showLabel) p.labelAlpha = Math.max(0, p.labelAlpha - dt * 0.00035);
        return p.t <= 1.02;
      });

      s.labelAnchors = s.labelAnchors.filter((a) => a.until > ts);

      s.beams = s.beams.filter((b) => {
        const prev = b.t;
        b.t += dt * 0.0018;
        if (b.kind === "query-chart" && prev < 0.98 && b.t >= 0.98) {
          s.chartPulse = 1;
          s.chartPts.push(nextMrrValue(s.chartIndex++));
          if (s.chartPts.length > 56) s.chartPts.shift();
        }
        return b.t <= 1.05;
      });

      if (ts - s.lastChartTick > 900) {
        s.lastChartTick = ts;
        s.chartPts.push(nextMrrValue(s.chartIndex++));
        if (s.chartPts.length > 56) s.chartPts.shift();
      }
      s.chartPulse = Math.max(0, s.chartPulse - dt * 0.002);

      if (s.insightActive) {
        const target = 1;
        const spring = (target - s.insightScale) * 0.14;
        s.insightVel = (s.insightVel + spring) * 0.82;
        s.insightScale += s.insightVel;
        if (s.insightScale > 1.08 && s.insightVel > 0) s.insightVel *= -0.35;
        if (s.insightScale > 0.98 && Math.abs(s.insightVel) < 0.002) {
          s.insightAlpha = Math.max(0, s.insightAlpha - dt * 0.00055);
        }
        if (s.insightAlpha <= 0) {
          s.insightActive = false;
          s.insightScale = 0;
        }
      }

      const { w, h } = layout;
      ctx.fillStyle = "#08080e";
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.035)";
      ctx.lineWidth = 1;
      const gridO = s.parallax;
      for (let x = 0; x < w; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x + gridO, 0);
        ctx.lineTo(x + gridO, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y + gridO * 0.4);
        ctx.lineTo(w, y + gridO * 0.4);
        ctx.stroke();
      }
      ctx.restore();

      layout.sources.forEach((src) => {
        const glow = ctx.createRadialGradient(
          src.x,
          src.y,
          4,
          src.x,
          src.y,
          42,
        );
        glow.addColorStop(0, "rgba(139,92,246,0.25)");
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(src.x, src.y, 42, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(12,12,18,0.94)";
        ctx.strokeStyle = "rgba(139,92,246,0.35)";
        roundRect(ctx, src.x - 50, src.y - 30, 100, 60, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#f4f4f7";
        ctx.font = "600 12px var(--font-geist-sans), sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(src.label, src.x, src.y - 5);
        ctx.fillStyle = "#a78bfa";
        ctx.font = "10px var(--font-geist-mono), monospace";
        ctx.fillText("track()", src.x, src.y + 15);

        ctx.strokeStyle = "rgba(139,92,246,0.45)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(src.x + 48, src.y);
        ctx.quadraticCurveTo(
          (src.x + layout.core.x) / 2,
          (src.y + layout.core.y) / 2 - 20,
          layout.core.x - layout.core.r,
          layout.core.y,
        );
        ctx.stroke();
      });

      const { core } = layout;
      const coreGlow = ctx.createRadialGradient(
        core.x,
        core.y,
        core.r * 0.15,
        core.x,
        core.y,
        core.r * 1.5 * s.corePulse,
      );
      coreGlow.addColorStop(0, "rgba(139,92,246,0.4)");
      coreGlow.addColorStop(0.6, "rgba(34,211,238,0.1)");
      coreGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(core.x, core.y, core.r * 1.45, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(10,10,16,0.92)";
      ctx.strokeStyle = "rgba(139,92,246,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(core.x, core.y, core.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "rgba(34,211,238,0.85)";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(
        core.x,
        core.y - core.r * 0.12,
        core.r * 0.78,
        Math.PI * 1.1,
        Math.PI * 1.1 + Math.PI * s.stmFill * 0.92,
      );
      ctx.stroke();

      ctx.strokeStyle = "rgba(139,92,246,0.75)";
      ctx.beginPath();
      ctx.arc(
        core.x,
        core.y + core.r * 0.18,
        core.r * 0.74,
        Math.PI * 0.08,
        Math.PI * 0.08 + Math.PI * 0.78,
      );
      ctx.stroke();

      const legendX = core.x + core.r + (layout.vertical ? -core.r * 2.1 : 14);
      const legendY = core.y - core.r * 0.05;
      ctx.textAlign = "left";
      ctx.font = "9px var(--font-geist-sans), sans-serif";
      ctx.fillStyle = "#22d3ee";
      ctx.fillText("● short-term", legendX, legendY - 10);
      ctx.fillStyle = "#a78bfa";
      ctx.fillText("● long-term", legendX, legendY + 6);
      if (s.lttb > 0.05) {
        ctx.fillStyle = `rgba(52,211,153,${0.4 + s.lttb * 0.5})`;
        ctx.font = "600 10px var(--font-geist-mono), monospace";
        ctx.fillText("LTTB compacting ↓", core.x - 48, core.y + core.r + 18);
      }

      ctx.textAlign = "center";
      ctx.fillStyle = "#f4f4f7";
      ctx.font = "600 13px var(--font-geist-sans), sans-serif";
      ctx.fillText("Metric memory", core.x, core.y - core.r * 0.42);
      ctx.fillStyle = "#22d3ee";
      ctx.font = "10px var(--font-geist-mono), monospace";
      ctx.fillText("stripe.mrr", core.x, core.y + core.r * 0.38);

      s.beams.forEach((b) => {
        const headT = Math.min(1, b.t);
        const hx = lerp(b.fromX, b.toX, headT);
        const hy = lerp(b.fromY, b.toY, headT);
        ctx.strokeStyle = b.color;
        ctx.globalAlpha = 0.28;
        ctx.lineWidth = b.width * 2.5;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(b.fromX, b.fromY);
        ctx.lineTo(b.toX, b.toY);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.lineWidth = b.width;
        ctx.strokeStyle = b.color;
        ctx.beginPath();
        ctx.moveTo(b.fromX, b.fromY);
        ctx.lineTo(b.toX, b.toY);
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(hx, hy, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      drawMcpNode(ctx, layout.query.x, layout.query.y, "query", "#22d3ee", "⌕");
      drawMcpNode(
        ctx,
        layout.insight.x,
        layout.insight.y,
        "insight",
        "#34d399",
        "✦",
      );

      if (s.insightActive && s.insightAlpha > 0.02) {
        const cx = layout.insight.x;
        const cy = layout.insight.y - 58;
        ctx.save();
        ctx.globalAlpha = s.insightAlpha;
        const sc = Math.max(0.01, s.insightScale);
        ctx.translate(cx, cy);
        ctx.scale(sc, sc);
        ctx.fillStyle = "rgba(52,211,153,0.22)";
        ctx.strokeStyle = "rgba(52,211,153,0.55)";
        ctx.shadowColor = "#34d399";
        ctx.shadowBlur = 16;
        roundRect(ctx, -82, -16, 164, 32, 10);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#6ee7b7";
        ctx.font = "600 11px var(--font-geist-sans), sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(INSIGHT_TEXT, 0, 4);
        ctx.restore();
      }

      drawChartPanel(ctx, layout, s.chartPts, s.chartPulse, layout.vertical);

      let labelCount = 0;
      const labelFont = layout.vertical
        ? "8px var(--font-geist-mono), monospace"
        : "9px var(--font-geist-mono), monospace";

      s.particles.forEach((p) => {
        const pos = curvePoint(
          p.sx,
          p.sy,
          p.tx,
          p.ty,
          Math.max(0, Math.min(1, p.t)),
        );
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12 * p.glow;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, layout.vertical ? 3 : 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (!p.showLabel || p.labelAlpha < 0.12 || labelCount >= maxLabels)
          return;

        const lx = pos.x;
        let ly = pos.y - 14;
        if (inForbiddenLabelZone(lx, ly, layout)) return;

        let ok = true;
        for (const a of s.labelAnchors) {
          if (Math.hypot(a.x - lx, a.y - ly) < 22) {
            ok = false;
            break;
          }
        }
        if (!ok) {
          ly -= 18;
          if (inForbiddenLabelZone(lx, ly, layout)) return;
        }

        labelCount += 1;
        s.labelAnchors.push({ x: lx, y: ly, until: ts + 1200 });
        ctx.globalAlpha = p.labelAlpha;
        ctx.font = labelFont;
        ctx.fillStyle = "rgba(244,244,247,0.92)";
        ctx.textAlign = "center";
        ctx.fillText(p.label, lx, ly);
        ctx.globalAlpha = 1;
      });
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div className="how-works-anim mt-6">
      <div
        ref={containerRef}
        className="gradient-border relative overflow-hidden rounded-2xl bg-[#08080e]"
      >
        <span className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-black/50 px-2.5 py-1 text-[10px] text-[#8b8b9e]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Live dataflow
        </span>
        <canvas ref={canvasRef} className="block w-full" aria-hidden />
      </div>
      <ChartUrlChip copied={copied} onCopy={copyUrl} />
    </div>
  );
}

function drawMcpNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  col: string,
  icon: string,
) {
  const g = ctx.createRadialGradient(x, y, 2, x, y, 38);
  g.addColorStop(0, `${col}33`);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, 38, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(8,8,14,0.96)";
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x - 46, y - 26, 92, 52, 11);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.font = "14px var(--font-geist-sans), sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(icon, x, y - 6);
  ctx.font = "10px var(--font-geist-mono), monospace";
  ctx.fillText(label, x, y + 14);
}

function drawChartPanel(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  pts: number[],
  pulse: number,
  vertical: boolean,
) {
  const ch = layout.chart;
  const padL = 36;
  const padR = 12;
  const padT = 34;
  const padB = 22;
  const plotW = ch.w - padL - padR;
  const plotH = ch.h - padT - padB;

  ctx.fillStyle = "rgba(6,6,12,0.96)";
  ctx.strokeStyle = "rgba(52,211,153,0.4)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, ch.x, ch.y, ch.w, ch.h, 14);
  ctx.fill();
  ctx.stroke();

  const minV = Math.min(...pts) - 0.06;
  const maxV = Math.max(...pts) + 0.05;
  const span = maxV - minV || 1;
  const toY = (v: number) => ch.y + padT + plotH - ((v - minV) / span) * plotH;
  const toX = (i: number) =>
    ch.x + padL + (i / Math.max(1, pts.length - 1)) * plotW;

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.font = "9px var(--font-geist-mono), monospace";
  ctx.fillStyle = "#6b6b80";
  ctx.textAlign = "right";
  for (let i = 0; i <= 3; i++) {
    const v = minV + (span * i) / 3;
    const y = toY(v);
    ctx.beginPath();
    ctx.moveTo(ch.x + padL, y);
    ctx.lineTo(ch.x + ch.w - padR, y);
    ctx.stroke();
    const dollars = (8 + v * 5.5).toFixed(1);
    ctx.fillText(`$${dollars}k`, ch.x + padL - 6, y + 3);
  }

  if (pts.length < 2) return;

  const areaGrad = ctx.createLinearGradient(0, ch.y + padT, 0, ch.y + ch.h);
  areaGrad.addColorStop(0, "rgba(139,92,246,0.35)");
  areaGrad.addColorStop(0.5, "rgba(34,211,238,0.12)");
  areaGrad.addColorStop(1, "rgba(52,211,153,0)");

  ctx.beginPath();
  pts.forEach((v, i) => {
    const x = toX(i);
    const y = toY(v);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  const lastX = toX(pts.length - 1);
  ctx.lineTo(lastX, ch.y + padT + plotH);
  ctx.lineTo(toX(0), ch.y + padT + plotH);
  ctx.closePath();
  ctx.fillStyle = areaGrad;
  ctx.fill();

  const lineGrad = ctx.createLinearGradient(ch.x, 0, ch.x + ch.w, 0);
  lineGrad.addColorStop(0, "#8b5cf6");
  lineGrad.addColorStop(0.5, "#22d3ee");
  lineGrad.addColorStop(1, "#34d399");
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  pts.forEach((v, i) => {
    const x = toX(i);
    const y = toY(v);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  const last = pts[pts.length - 1]!;
  const lx = toX(pts.length - 1);
  const ly = toY(last);
  const pr = 5 + pulse * 8;
  ctx.fillStyle = `rgba(52,211,153,${0.35 + pulse * 0.4})`;
  ctx.beginPath();
  ctx.arc(lx, ly, pr, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#34d399";
  ctx.shadowColor = "#34d399";
  ctx.shadowBlur = 10 + pulse * 12;
  ctx.beginPath();
  ctx.arc(lx, ly, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  const mrr = (8 + last * 5.5).toFixed(1);
  ctx.textAlign = "left";
  ctx.font = "600 11px var(--font-geist-sans), sans-serif";
  ctx.fillStyle = "#f4f4f7";
  ctx.fillText("stripe.mrr", ch.x + padL, ch.y + 18);
  const badgeW = vertical ? 112 : 118;
  roundRect(
    ctx,
    ch.x + ch.w - padR - badgeW,
    ch.y + 10,
    badgeW,
    22,
    8,
  );
  ctx.fillStyle = "rgba(52,211,153,0.15)";
  ctx.strokeStyle = "rgba(52,211,153,0.45)";
  ctx.fill();
  ctx.stroke();
  ctx.font = "600 10px var(--font-geist-mono), monospace";
  ctx.fillStyle = "#6ee7b7";
  ctx.textAlign = "center";
  ctx.fillText(
    `$${mrr}k ↑18%`,
    ch.x + ch.w - padR - badgeW / 2,
    ch.y + 24,
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}