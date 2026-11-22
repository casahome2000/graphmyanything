"use client";

import { useEffect, useRef, useState } from "react";

export const CYCLE_MS = 10_000;
export const BEAT_MS = [2_500, 2_500, 2_500, 2_500] as const;

export type StoryBeat = 0 | 1 | 2 | 3;

export type StoryTimeline = {
  beat: StoryBeat;
  /** 0–1 progress within the current beat */
  beatProgress: number;
  /** Monotonic cycle index (resets CSS animations) */
  cycle: number;
  elapsed: number;
  playing: boolean;
};

export function useStoryTimeline(containerRef: React.RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false);
  const [timeline, setTimeline] = useState<StoryTimeline>({
    beat: 0,
    beatProgress: 0,
    cycle: 0,
    elapsed: 0,
    playing: false,
  });
  const pausedAt = useRef<number | null>(null);
  const anchor = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [containerRef]);

  useEffect(() => {
    if (!inView) {
      pausedAt.current = performance.now();
      setTimeline((t) => ({ ...t, playing: false }));
      return;
    }

    if (pausedAt.current !== null) {
      const gap = performance.now() - pausedAt.current;
      anchor.current += gap;
      pausedAt.current = null;
    } else if (anchor.current === 0) {
      anchor.current = performance.now();
    }

    let raf = 0;
    const tick = (now: number) => {
      const elapsed = (now - anchor.current) % CYCLE_MS;
      const cycle = Math.floor((now - anchor.current) / CYCLE_MS);
      let beat: StoryBeat = 0;
      let beatStart = 0;
      for (let i = 0; i < BEAT_MS.length; i++) {
        if (elapsed < beatStart + BEAT_MS[i]) {
          beat = i as StoryBeat;
          const beatProgress =
            (elapsed - beatStart) / BEAT_MS[i];
          setTimeline({
            beat,
            beatProgress,
            cycle,
            elapsed,
            playing: true,
          });
          raf = requestAnimationFrame(tick);
          return;
        }
        beatStart += BEAT_MS[i];
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  return timeline;
}