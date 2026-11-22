const QUERY_REQUEST = `// MCP: query
await mcp.call("graphmyanything", "query", {
  namespace: "stripe.mrr",
  range: "90d",
  token_budget: 120,
});`;

const QUERY_RESPONSE = `{
  "namespace": "stripe.mrr",
  "latest": 72400,
  "min": 61200,
  "max": 73100,
  "mean": 68450,
  "trend": "up",
  "pct_change": 12.4,
  "series_lttb": [/* ~50 points */],
  "tokens_estimate": 94
}`;

export function CodeSnippet() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          One compact <span className="font-mono text-violet-300">query</span>
        </h2>
        <p className="mt-2 max-w-2xl text-[#8b8b9e]">
          Latest, min, max, mean, trend, percent change—plus an LTTB-downsampled
          series within your token budget.
        </p>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="glass rounded-2xl p-5 sm:p-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[#8b8b9e]">
              Request
            </p>
            <pre className="overflow-x-auto font-mono text-[13px] leading-relaxed text-cyan-200/90">
              <code>{QUERY_REQUEST}</code>
            </pre>
          </div>
          <div className="glass rounded-2xl p-5 sm:p-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[#8b8b9e]">
              Response
            </p>
            <pre className="overflow-x-auto font-mono text-[13px] leading-relaxed text-emerald-200/90">
              <code>{QUERY_RESPONSE}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}