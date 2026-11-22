export function TokenComparison() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Stop burning tokens on throwaway Python
        </h2>
        <p className="mt-2 text-sm text-[#8b8b9e]">
          Illustrative estimate—published benchmark pending.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-6">
            <h3 className="text-sm font-medium text-rose-200">
              Throwaway Python
            </h3>
            <p className="mt-4 font-mono text-4xl font-semibold text-rose-300">
              2,000–8,000+
            </p>
            <p className="mt-1 text-sm text-[#8b8b9e]">tokens per question</p>
            <ul className="mt-6 space-y-2 text-sm text-[#8b8b9e]">
              <li>• Fetch raw points, pandas, matplotlib</li>
              <li>• Retries when context overflows</li>
              <li>• No memory across sessions</li>
            </ul>
          </div>
          <div className="gradient-border rounded-2xl p-6">
            <h3 className="text-sm font-medium text-emerald-200">
              GraphMyAnything <span className="text-[#8b8b9e]">query</span>
            </h3>
            <p className="mt-4 font-mono text-4xl font-semibold gradient-text">
              ~100
            </p>
            <p className="mt-1 text-sm text-[#8b8b9e]">tokens per summary</p>
            <ul className="mt-6 space-y-2 text-sm text-[#8b8b9e]">
              <li>• Pre-aggregated stats + LTTB series</li>
              <li>• Short- and long-term memory built in</li>
              <li>• Same namespace every time</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}