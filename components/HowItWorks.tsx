"use client";

import { FlowCanvas } from "./how-it-works/FlowCanvas";
import { HowItWorksStatic } from "./how-it-works/HowItWorksStatic";

export function HowItWorks() {
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
          Streams of metrics. One memory. Live charts.
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[#8b8b9e] sm:text-base">
          Agents and cron jobs call{" "}
          <span className="font-mono text-violet-300/90">track()</span>—data
          lands in short-term buffers, compacts into long-term namespaces, then
          flows out through{" "}
          <span className="font-mono text-cyan-300/90">query</span> and{" "}
          <span className="font-mono text-emerald-300/90">insight</span> to a
          permanent chart URL.
        </p>

        <FlowCanvas />
        <HowItWorksStatic />
      </div>
    </section>
  );
}