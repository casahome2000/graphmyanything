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
        { x: w * 0.2, y: h * 0.1, label: "Claude" },
        { x: w * 0.5, y: h * 0.1, label: "GPT" },
        { x: w * 0.8, y: h * 0.1, label: "Cron" },
      ],
      core: { x: w * 0.5, y: h * 0.38, r: Math.min(w, h) * 0.14 },
      query: { x: w * 0.28, y: h * 0.58 },
      insight: { x: w * 0.72, y: h * 0.58 },
      chart: { x: w * 0.08, y: h * 0.68, w: w * 0.84, h: h * 0.22 },
    };
  }
  return {
    w,
    h,
    vertical: false,
    sources: [
      { x: 70, y: 95, label: "Claude" },
      { x: 70, y: 200, label: "GPT" },
      { x: 70, y: 305, label: "Cron" },
    ],
    core: { x: w * 0.46, y: h * 0.5, r: 78 },
    query: { x: w * 0.62, y: h * 0.36 },
    insight: { x: w * 0.62, y: h * 0.64 },
    chart: { x: w * 0.74, y: h * 0.22, w: w * 0.22, h: h * 0.56 },
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
};

type Beam = {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  t: number;
  color: string;
  width: number;
};

type Trail = { x: number; y: number; life: number; color: string };

export function FlowCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const runningRef = useRef(true);
  const stateRef = useRef({
    particles: [] as Particle[],
    beams: [] as Beam[],
    trails: [] as Trail[],
    stmFill: 0.35,
    lttb: 0,
    corePulse: 0,
    insightPop: 0,
    chartPts: [] as number[],
    chartHead: 0,
    lastEmit: 0,
    lastBeam: 0,
    lastLttb: 0,
    time: 0,
    parallax: 0,
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
    let layout = getLayout(900, 420);

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = Math.max(rect.width, 320);
      const cssH =
        cssW < 640 ? Math.max(520, cssW * 1.12) : Math.max(380, cssW * 0.46);
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

    const emitFrom = (sx: number, sy: number, tx: number, ty: number) => {
      const ev =
        METRIC_EVENTS[Math.floor(Math.random() * METRIC_EVENTS.length)];
      stateRef.current.particles.push({
        sx,
        sy,
        tx,
        ty,
        t: 0,
        speed: 0.008 + Math.random() * 0.012,
        label: ev.label,
        color: ev.color,
        glow: 0.6 + Math.random() * 0.4,
      });
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const curvePoint = (
      sx: number,
      sy: number,
      tx: number,
      ty: number,
      t: number,
    ) => {
      const cx = (sx + tx) / 2 + (ty - sy) * 0.15;
      const cy = (sy + ty) / 2 - (tx - sx) * 0.08;
      const u = 1 - t;
      return {
        x: u * u * sx + 2 * u * t * cx + t * t * tx,
        y: u * u * sy + 2 * u * t * cy + t * t * ty,
      };
    };

    const draw = (ts: number) => {
      raf = requestAnimationFrame(draw);
      if (!runningRef.current) return;

      const s = stateRef.current;
      const dt = Math.min(32, ts - (s.time || ts));
      s.time = ts;
      s.parallax = Math.sin(ts * 0.0004) * 8;
      s.corePulse = 0.85 + Math.sin(ts * 0.003) * 0.15;
      s.insightPop = 0.7 + Math.sin(ts * 0.002 + 1) * 0.3;

      if (ts - s.lastEmit > 280) {
        s.lastEmit = ts;
        layout.sources.forEach((src) => {
          emitFrom(src.x, src.y, layout.core.x, layout.core.y);
          if (Math.random() > 0.45) {
            emitFrom(src.x, src.y, layout.core.x, layout.core.y);
          }
        });
      }

      if (ts - s.lastBeam > 1400) {
        s.lastBeam = ts;
        s.beams.push({
          fromX: layout.core.x,
          fromY: layout.core.y,
          toX: layout.query.x,
          toY: layout.query.y,
          t: 0,
          color: "#22d3ee",
          width: 4,
        });
        s.beams.push({
          fromX: layout.core.x,
          fromY: layout.core.y,
          toX: layout.insight.x,
          toY: layout.insight.y,
          t: 0,
          color: "#34d399",
          width: 5,
        });
        s.beams.push({
          fromX: layout.query.x,
          fromY: layout.query.y,
          toX: layout.chart.x + layout.chart.w * 0.2,
          toY: layout.chart.y + layout.chart.h * 0.35,
          t: 0,
          color: "#22d3ee",
          width: 3,
        });
        s.insightPop = 1.4;
      }

      if (ts - s.lastLttb > 3200) {
        s.lastLttb = ts;
        s.lttb = 1;
        for (let i = 0; i < 14; i++) {
          const angle = Math.PI * 0.25 + (i / 14) * Math.PI * 0.5;
          const r = layout.core.r * 0.7;
          emitFrom(
            layout.core.x + Math.cos(angle) * r,
            layout.core.y - layout.core.r * 0.2,
            layout.core.x,
            layout.core.y + layout.core.r * 0.55,
          );
        }
      }
      s.lttb = Math.max(0, s.lttb - dt * 0.00035);

      s.stmFill = Math.min(0.95, s.stmFill + dt * 0.00008);
      if (s.lttb > 0.2) s.stmFill = Math.max(0.25, s.stmFill - dt * 0.0005);

      s.particles = s.particles.filter((p) => {
        p.t += p.speed * (dt / 16);
        return p.t <= 1.05;
      });

      s.beams = s.beams.filter((b) => {
        b.t += dt * 0.002;
        return b.t <= 1.1;
      });

      if (s.chartPts.length < 48) {
        s.chartHead += dt * 0.00012;
        s.chartPts.push(
          0.52 +
            Math.sin(s.chartHead * 3) * 0.08 +
            s.chartPts.length * 0.004,
        );
      } else {
        s.chartPts.shift();
        s.chartHead += dt * 0.00012;
        s.chartPts.push(
          0.52 + Math.sin(s.chartHead * 3) * 0.08 + Math.random() * 0.02,
        );
      }

      const { w, h } = layout;
      ctx.fillStyle = "#08080e";
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      const gridO = s.parallax;
      for (let x = -20; x < w + 20; x += 28) {
        ctx.beginPath();
        ctx.moveTo(x + gridO, 0);
        ctx.lineTo(x + gridO, h);
        ctx.stroke();
      }
      for (let y = -20; y < h + 20; y += 28) {
        ctx.beginPath();
        ctx.moveTo(0, y + gridO * 0.5);
        ctx.lineTo(w, y + gridO * 0.5);
        ctx.stroke();
      }
      ctx.restore();

      layout.sources.forEach((src) => {
        ctx.fillStyle = "rgba(12,12,18,0.92)";
        ctx.strokeStyle = "rgba(255,255,255,0.14)";
        roundRect(ctx, src.x - 48, src.y - 32, 96, 64, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#f4f4f7";
        ctx.font = "600 12px var(--font-geist-sans), sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(src.label, src.x, src.y - 6);
        ctx.fillStyle = "#8b5cf6";
        ctx.font = "11px var(--font-geist-mono), monospace";
        ctx.fillText("track()", src.x, src.y + 14);

        const grad = ctx.createLinearGradient(src.x, src.y, layout.core.x, layout.core.y);
        grad.addColorStop(0, "rgba(139,92,246,0.5)");
        grad.addColorStop(1, "rgba(34,211,238,0.35)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(src.x + 40, src.y);
        const mx = (src.x + layout.core.x) / 2;
        const my = (src.y + layout.core.y) / 2 - 30;
        ctx.quadraticCurveTo(mx, my, layout.core.x - layout.core.r * 0.5, layout.core.y);
        ctx.stroke();
      });

      const { core } = layout;
      const glow = ctx.createRadialGradient(
        core.x,
        core.y,
        core.r * 0.2,
        core.x,
        core.y,
        core.r * 1.8 * s.corePulse,
      );
      glow.addColorStop(0, "rgba(139,92,246,0.35)");
      glow.addColorStop(0.5, "rgba(34,211,238,0.12)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(core.x, core.y, core.r * 1.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(10,10,16,0.88)";
      ctx.strokeStyle = "rgba(139,92,246,0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(core.x, core.y, core.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "rgba(34,211,238,0.7)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(
        core.x,
        core.y - core.r * 0.15,
        core.r * 0.75,
        Math.PI * 1.15,
        Math.PI * 1.15 + Math.PI * s.stmFill,
      );
      ctx.stroke();

      ctx.strokeStyle = "rgba(139,92,246,0.55)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(
        core.x,
        core.y + core.r * 0.2,
        core.r * 0.72,
        Math.PI * 0.05,
        Math.PI * 0.05 + Math.PI * 0.85,
      );
      ctx.stroke();

      if (s.lttb > 0.05) {
        ctx.fillStyle = `rgba(52,211,153,${0.15 + s.lttb * 0.35})`;
        ctx.font = "10px var(--font-geist-mono), monospace";
        ctx.textAlign = "center";
        ctx.fillText("LTTB ↓", core.x, core.y + 6);
      }

      ctx.fillStyle = "#f4f4f7";
      ctx.font = "600 13px var(--font-geist-sans), sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Metric memory", core.x, core.y - core.r * 0.35);
      ctx.fillStyle = "#22d3ee";
      ctx.font = "10px var(--font-geist-mono), monospace";
      ctx.fillText("stripe.mrr", core.x, core.y + core.r * 0.42);

      s.beams.forEach((b) => {
        const x = lerp(b.fromX, b.toX, Math.min(1, b.t));
        const y = lerp(b.fromY, b.toY, Math.min(1, b.t));
        ctx.strokeStyle = b.color;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = b.width * 3;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(b.fromX, b.fromY);
        ctx.lineTo(b.toX, b.toY);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.lineWidth = b.width;
        ctx.beginPath();
        ctx.moveTo(b.fromX, b.fromY);
        ctx.lineTo(b.toX, b.toY);
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      const drawMcpNode = (
        x: number,
        y: number,
        label: string,
        col: string,
      ) => {
        ctx.fillStyle = "rgba(8,8,14,0.95)";
        ctx.strokeStyle = `${col}66`;
        roundRect(ctx, x - 44, y - 22, 88, 44, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = col;
        ctx.font = "11px var(--font-geist-mono), monospace";
        ctx.textAlign = "center";
        ctx.fillText(label, x, y + 4);
      };
      drawMcpNode(layout.query.x, layout.query.y, "query", "#22d3ee");
      drawMcpNode(layout.insight.x, layout.insight.y, "insight", "#34d399");

      const pop = Math.min(1.2, s.insightPop);
      ctx.save();
      ctx.globalAlpha = Math.min(1, pop);
      ctx.translate(layout.insight.x, layout.insight.y - 52);
      ctx.scale(pop, pop);
      ctx.fillStyle = "rgba(52,211,153,0.18)";
      ctx.strokeStyle = "rgba(52,211,153,0.5)";
      roundRect(ctx, -75, -14, 150, 28, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#34d399";
      ctx.font = "600 11px var(--font-geist-sans), sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(INSIGHT_TEXT, 0, 4);
      ctx.restore();
      s.insightPop = Math.max(0.7, s.insightPop - dt * 0.00015);

      const ch = layout.chart;
      ctx.fillStyle = "rgba(8,8,14,0.95)";
      ctx.strokeStyle = "rgba(52,211,153,0.35)";
      roundRect(ctx, ch.x, ch.y, ch.w, ch.h, 14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f4f4f7";
      ctx.font = "600 12px var(--font-geist-sans), sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Live chart", ch.x + 14, ch.y + 22);

      const pts = s.chartPts;
      if (pts.length > 1) {
        const grad = ctx.createLinearGradient(ch.x, ch.y, ch.x + ch.w, ch.y);
        grad.addColorStop(0, "#8b5cf6");
        grad.addColorStop(0.5, "#22d3ee");
        grad.addColorStop(1, "#34d399");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = "round";
        ctx.beginPath();
        pts.forEach((v, i) => {
          const x = ch.x + 14 + (i / (pts.length - 1)) * (ch.w - 28);
          const y = ch.y + ch.h - 20 - v * (ch.h - 44);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        const lx =
          ch.x + 14 + ((pts.length - 1) / (pts.length - 1)) * (ch.w - 28);
        const ly = ch.y + ch.h - 20 - pts[pts.length - 1]! * (ch.h - 44);
        ctx.fillStyle = "#34d399";
        ctx.shadowColor = "#34d399";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(lx, ly, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      s.particles.forEach((p) => {
        const pos = curvePoint(p.sx, p.sy, p.tx, p.ty, Math.min(1, p.t));
        s.trails.push({ x: pos.x, y: pos.y, life: 1, color: p.color });
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 14 * p.glow;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        if (p.t < 0.92) {
          ctx.font = "9px var(--font-geist-mono), monospace";
          ctx.fillStyle = "rgba(244,244,247,0.9)";
          ctx.textAlign = "center";
          ctx.fillText(p.label, pos.x, pos.y - 10);
        }
      });

      s.trails = s.trails.filter((t) => {
        t.life -= dt * 0.002;
        if (t.life <= 0) return false;
        ctx.globalAlpha = t.life * 0.25;
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        return true;
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