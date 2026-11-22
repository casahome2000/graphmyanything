import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { NPM_LIVE } from "@/lib/product/npm-live";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "GraphMyAnything MCP tools, example calls, and how to connect agents in Claude Desktop, Cursor, and Claude Code.",
  alternates: { canonical: "https://graphmyanything.com/docs" },
};

const MCP_PACKAGE = "@graphmyanything/mcp";

function CodeBlock({ children, label }: { children: string; label?: string }) {
  return (
    <div className="mt-4 rounded-xl border border-white/[0.08] bg-[#08080e] p-4">
      {label ? (
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#8b8b9e]">
          {label}
        </p>
      ) : null}
      <pre className="overflow-x-auto font-mono text-[12px] leading-relaxed text-cyan-200/90">
        <code>{children}</code>
      </pre>
    </div>
  );
}

const tools = [
  {
    name: "track",
    summary: "Write one point, a batch, or backfill history into a namespace.",
    request: `await mcp.call("graphmyanything", "track", {
  namespace: "stripe.mrr",
  points: [{ t: "2026-11-22T00:00:00Z", value: 72400 }],
});`,
    response: `{
  "namespace": "stripe.mrr",
  "accepted": 1,
  "latest": 72400
}`,
  },
  {
    name: "query",
    summary:
      "Token-budgeted stats plus an LTTB-downsampled series for the agent.",
    request: `await mcp.call("graphmyanything", "query", {
  namespace: "stripe.mrr",
  range: "90d",
  token_budget: 120,
});`,
    response: `{
  "namespace": "stripe.mrr",
  "latest": 72400,
  "trend": "up",
  "pct_change": 12.4,
  "series_lttb": [/* ~50 points */],
  "tokens_estimate": 94
}`,
  },
  {
    name: "insight",
    summary: "Plain-English findings—trend, anomalies, and short forecast.",
    request: `await mcp.call("graphmyanything", "insight", {
  namespace: "stripe.mrr",
  range: "180d",
});`,
    response: `{
  "namespace": "stripe.mrr",
  "headline": "MRR up 12% over 90d; no anomalies in last 7d",
  "bullets": ["WoW +2.1%", "Forecast +8% next month (low confidence)"]
}`,
  },
  {
    name: "chart",
    summary: "Stable chart URL with transforms (range, type, forecast).",
    request: `await mcp.call("graphmyanything", "chart", {
  namespace: "stripe.mrr",
  range: "90d",
  type: "area",
});`,
    response: `{
  "namespace": "stripe.mrr",
  "url": "https://graphmyanything.com/c/stripe.mrr?range=90d&type=area",
  "expires": false
}`,
  },
];

export default function DocsPage() {
  const stdioCommand = NPM_LIVE
    ? `npx -y ${MCP_PACKAGE}`
    : "Coming soon — join the waitlist for early access";

  return (
    <LegalPageLayout title="Docs" eyebrow="GraphMyAnything">
      <p className="text-sm leading-relaxed text-[#8b8b9e]">
        GraphMyAnything is <strong className="font-medium text-[#f4f4f7]">metric memory for AI agents</strong>
        : namespaces of numbers over time with short- and long-term retention. Your agent calls MCP tools
        instead of spawning throwaway Python—compact summaries, durable history, and live chart URLs.
      </p>

      <section className="mt-10 border-t border-white/[0.06] pt-10">
        <h2 className="text-lg font-semibold tracking-tight text-[#f4f4f7]">
          Four MCP tools
        </h2>
        <p className="mt-2 text-sm text-[#8b8b9e]">
          Namespaces isolate metrics (for example <code className="font-mono text-violet-300/90">stripe.mrr</code>
          ). All tools are designed for agent context limits.
        </p>
        <ul className="mt-6 space-y-10">
          {tools.map((tool) => (
            <li key={tool.name}>
              <h3 className="font-mono text-base text-cyan-300">{tool.name}</h3>
              <p className="mt-1 text-sm text-[#8b8b9e]">{tool.summary}</p>
              <CodeBlock label="Example call">{tool.request}</CodeBlock>
              <CodeBlock label="Example response">{tool.response}</CodeBlock>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 border-t border-white/[0.06] pt-10">
        <h2 className="text-lg font-semibold tracking-tight text-[#f4f4f7]">
          MCP server install
        </h2>
        {NPM_LIVE ? (
          <p className="mt-2 text-sm text-[#8b8b9e]">
            The package is published on npm. Use the stdio command below in your client config.
          </p>
        ) : (
          <p className="mt-2 text-sm text-[#8b8b9e]">
            The npm package is not published yet.{" "}
            <strong className="font-medium text-[#f4f4f7]">Coming soon</strong> —{" "}
            <Link href="/#waitlist" className="text-cyan-300/90 underline underline-offset-2">
              join the waitlist
            </Link>{" "}
            for install instructions at launch.
          </p>
        )}
        <CodeBlock label="Stdio command">{stdioCommand}</CodeBlock>
      </section>

      <section className="mt-10 border-t border-white/[0.06] pt-10">
        <h2 className="text-lg font-semibold tracking-tight text-[#f4f4f7]">
          Claude Desktop
        </h2>
        <p className="mt-2 text-sm text-[#8b8b9e]">
          Add a server entry to{" "}
          <code className="font-mono text-[#f4f4f7]/80">claude_desktop_config.json</code>{" "}
          (see Anthropic&apos;s MCP docs for the file location on your OS).
        </p>
        {NPM_LIVE ? (
          <CodeBlock label="Example entry">
            {`{
  "mcpServers": {
    "graphmyanything": {
      "command": "npx",
      "args": ["-y", "${MCP_PACKAGE}"]
    }
  }
}`}
          </CodeBlock>
        ) : (
          <CodeBlock label="Example entry (placeholder until npm publish)">
            {`{
  "mcpServers": {
    "graphmyanything": {
      "_note": "Install command coming soon — join the waitlist at graphmyanything.com"
    }
  }
}`}
          </CodeBlock>
        )}
      </section>

      <section className="mt-10 border-t border-white/[0.06] pt-10">
        <h2 className="text-lg font-semibold tracking-tight text-[#f4f4f7]">
          Cursor
        </h2>
        <p className="mt-2 text-sm text-[#8b8b9e]">
          Open <strong className="font-medium text-[#f4f4f7]">Cursor Settings → MCP</strong> and add a
          new stdio server with the same command as above. Restart Cursor after saving.
        </p>
      </section>

      <section className="mt-10 border-t border-white/[0.06] pt-10">
        <h2 className="text-lg font-semibold tracking-tight text-[#f4f4f7]">
          Claude Code
        </h2>
        <p className="mt-2 text-sm text-[#8b8b9e]">
          Register the MCP server in your Claude Code MCP configuration (stdio transport) using the install
          command above once the package is live.
        </p>
      </section>

      <section className="mt-10 border-t border-white/[0.06] pt-10">
        <h2 className="text-lg font-semibold tracking-tight text-[#f4f4f7]">
          API key (at launch)
        </h2>
        <p className="mt-2 text-sm text-[#8b8b9e]">
          Waitlist members will receive an API key when the hosted service opens. Until then, explore the
          landing demo and{" "}
          <Link href="/#tools" className="text-cyan-300/90 underline underline-offset-2">
            tool overview
          </Link>
          .
        </p>
      </section>
    </LegalPageLayout>
  );
}