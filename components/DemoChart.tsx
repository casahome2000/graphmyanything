import { MetricChartVisual } from "./MetricChartVisual";

const CHART_URL =
  "https://graphmyanything.com/c/stripe.mrr.png?range=90d&type=line&forecast=30d";

export function DemoChart() {
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
          <code className="mt-2 hidden break-all rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 font-mono text-[11px] text-cyan-300/90 sm:max-w-md sm:text-xs lg:block">
            {CHART_URL}
          </code>
        </div>
        <MetricChartVisual variant="full" showUrl={false} />
      </div>
    </section>
  );
}