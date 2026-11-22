const cases = [
  {
    title: "Weekly KPI chart to Slack",
    body: "Pipe your agent's chart URL through n8n. When metrics update, Slack gets a fresh sparkline—no screenshot chore.",
    tag: "n8n · Slack",
  },
  {
    title: "MRR chart in a README",
    body: "Embed a live URL in your repo docs. Investors see current MRR, not a PNG from last quarter.",
    tag: "README · embed",
  },
  {
    title: "Ask your agent for the chart",
    body: "Your coding agent calls chart with transforms (range, type, forecast). It drops the URL straight into your reply.",
    tag: "MCP · agents",
  },
];

export function UseCases() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Built for how agents actually work
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {cases.map((c) => (
            <article
              key={c.title}
              className="glass flex flex-col rounded-2xl p-6 transition hover:border-white/[0.14]"
            >
              <span className="text-xs font-medium text-violet-300/90">
                {c.tag}
              </span>
              <h3 className="mt-3 text-lg font-medium">{c.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[#8b8b9e]">
                {c.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}