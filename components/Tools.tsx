const tools = [
  {
    name: "track",
    summary: "Write points—single, batch, or historical backfill.",
    detail:
      "Every namespace accumulates short-term buffers and durable long-term storage.",
  },
  {
    name: "query",
    summary:
      "Compact summary: latest, min, max, mean, trend, % change, LTTB ~50 points.",
    detail: "Respects token_budget so agents stay within context limits.",
  },
  {
    name: "insight",
    summary: "Plain-English findings—trend, anomalies, forecast.",
    detail: "Narrative your agent can quote without parsing thousands of rows.",
  },
  {
    name: "chart",
    summary: "Permanent live-updating chart URL with URL transforms.",
    detail:
      "Cloudinary-style params: range, type, forecast. Works everywhere images work.",
  },
];

export function Tools() {
  return (
    <section id="tools" className="scroll-mt-20 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Four MCP tools
        </h2>
        <p className="mt-2 max-w-2xl text-[#8b8b9e]">
          Everything an agent needs to remember and reason about numbers over
          time—without touching raw series.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {tools.map((t) => (
            <div key={t.name} className="gradient-border rounded-2xl p-6">
              <code className="font-mono text-lg text-cyan-300">{t.name}</code>
              <p className="mt-3 text-sm font-medium text-[#f4f4f7]">
                {t.summary}
              </p>
              <p className="mt-2 text-sm text-[#8b8b9e]">{t.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}