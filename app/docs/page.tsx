import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import {
  MCP_GITHUB_URL,
  MCP_NPM_PACKAGE,
  MCP_NPM_URL,
  NPM_LIVE,
} from "@/lib/product/npm-live";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "Install graphmyanything-mcp, tool schemas, and MCP setup for Claude Desktop, Cursor, and Claude Code.",
  alternates: { canonical: "https://graphmyanything.com/docs" },
};

const MCP_CONFIG_JSON = `{
  "mcpServers": {
    "graphmyanything": {
      "command": "npx",
      "args": ["-y", "${MCP_NPM_PACKAGE}"]
    }
  }
}`;

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
    summary:
      "Record a value, batch, or historical points (`metric`, `value` or `points[]`, optional `tags`).",
    request: `{
  "metric": "stripe.mrr",
  "value": 84210,
  "tags": { "plan": "pro" }
}`,
    response: `{
  "ok": true,
  "metric": "stripe.mrr",
  "written": 1
}`,
  },
  {
    name: "query",
    summary:
      "Terse summary + optional LTTB series within `token_budget` (`metric`, `range`, `token_budget`, optional `points`, `also_chart`).",
    request: `{
  "metric": "stripe.mrr",
  "range": "90d",
  "token_budget": 200
}`,
    response: `{
  "m": "stripe.mrr",
  "rg": "90d",
  "s": { "l": 84210, "mn": 61200, "mx": 84210, "mu": 72450, "tr": "up", "pct": 12.4, "n": 90 },
  "pts": [[1700000000, 61200], "…"],
  "tokens_estimate": 94
}`,
  },
  {
    name: "insight",
    summary: "Plain-English trend, MAD anomalies, naive forecast (`metric`, `range`).",
    request: `{
  "metric": "stripe.mrr",
  "range": "90d"
}`,
    response: `{
  "summary": "stripe.mrr (90d): trend up, latest 84210 …",
  "trend": "up",
  "anomalies": [],
  "forecast": { "horizon": 3, "next_values": [84320, 84440, 84560], "method": "linear" },
  "stats": { "latest": 84210, "trend": "up", "pct_change": 12.4, "count": 90 }
}`,
  },
  {
    name: "chart",
    summary:
      "Dark-theme SVG on disk (`metric`, `range`, `type`, `theme`); hosted URLs ship later.",
    request: `{
  "metric": "stripe.mrr",
  "range": "90d",
  "type": "area",
  "theme": "dark"
}`,
    response: `{
  "path": "/Users/you/.graphmyanything/charts/stripe.mrr-….svg",
  "url": null,
  "hosted_url_note": "Hosted live chart URLs are coming soon: graphmyanything.com"
}`,
  },
];

export default function DocsPage() {
  const installCmd = NPM_LIVE
    ? `npx -y ${MCP_NPM_PACKAGE}`
    : "Coming soon — see /docs when the package is published";

  return (
    <LegalPageLayout title="Docs" eyebrow="GraphMyAnything">
      <p className="text-sm leading-relaxed text-[#8b8b9e]">
        GraphMyAnything is{" "}
        <strong className="font-medium text-[#f4f4f7]">
          metric memory for AI agents
        </strong>
        : local-first SQLite storage with token-efficient{" "}
        <code className="font-mono text-violet-300/90">track</code>,{" "}
        <code className="font-mono text-violet-300/90">query</code>,{" "}
        <code className="font-mono text-violet-300/90">insight</code>, and{" "}
        <code className="font-mono text-violet-300/90">chart</code> MCP tools.
        Hosted live chart URLs on graphmyanything.com are coming for founding
        members—the open-source server writes SVGs locally today.
      </p>

      {NPM_LIVE ? (
        <p className="mt-4 text-sm text-[#8b8b9e]">
          Package:{" "}
          <a
            href={MCP_NPM_URL}
            className="text-cyan-300/90 underline underline-offset-2 hover:text-cyan-200"
            rel="noopener noreferrer"
            target="_blank"
          >
            {MCP_NPM_PACKAGE}
          </a>
          {" · "}
          <a
            href={MCP_GITHUB_URL}
            className="text-cyan-300/90 underline underline-offset-2 hover:text-cyan-200"
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub repo
          </a>
          {" "}
          (<code className="font-mono text-[#f4f4f7]/70">packages/mcp-server</code>
          )
        </p>
      ) : null}

      <section className="mt-10 border-t border-white/[0.06] pt-10">
        <h2 className="text-lg font-semibold tracking-tight text-[#f4f4f7]">
          Four MCP tools
        </h2>
        <p className="mt-2 text-sm text-[#8b8b9e]">
          Parameter names match{" "}
          <code className="font-mono text-[#f4f4f7]/80">tool-catalog.ts</code> in
          the MCP server. Metrics are keyed by{" "}
          <code className="font-mono text-violet-300/90">metric</code> (for
          example <code className="font-mono text-violet-300/90">stripe.mrr</code>
          ).
        </p>
        <ul className="mt-6 space-y-10">
          {tools.map((tool) => (
            <li key={tool.name}>
              <h3 className="font-mono text-base text-cyan-300">{tool.name}</h3>
              <p className="mt-1 text-sm text-[#8b8b9e]">{tool.summary}</p>
              <CodeBlock label="Example arguments">{tool.request}</CodeBlock>
              <CodeBlock label="Example response">{tool.response}</CodeBlock>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 border-t border-white/[0.06] pt-10">
        <h2 className="text-lg font-semibold tracking-tight text-[#f4f4f7]">
          MCP server install
        </h2>
        <p className="mt-2 text-sm text-[#8b8b9e]">
          Requires Node.js <strong className="font-medium text-[#f4f4f7]">22.13+</strong>{" "}
          (built-in <code className="font-mono text-[#f4f4f7]/80">node:sqlite</code>
          ). Metrics persist at{" "}
          <code className="font-mono text-[#f4f4f7]/80">~/.graphmyanything/metrics.db</code>{" "}
          (override with{" "}
          <code className="font-mono text-[#f4f4f7]/80">GRAPHMYANYTHING_DB_PATH</code>
          ). Charts write beside the DB or under{" "}
          <code className="font-mono text-[#f4f4f7]/80">GRAPHMYANYTHING_CHARTS_DIR</code>
          . No telemetry—the package does not phone home.
        </p>
        <CodeBlock label="Install (stdio)">{installCmd}</CodeBlock>
      </section>

      <section className="mt-10 border-t border-white/[0.06] pt-10">
        <h2 className="text-lg font-semibold tracking-tight text-[#f4f4f7]">
          Cursor
        </h2>
        <p className="mt-2 text-sm text-[#8b8b9e]">
          Add to <code className="font-mono text-[#f4f4f7]/80">.cursor/mcp.json</code> or{" "}
          <strong className="font-medium text-[#f4f4f7]">Cursor Settings → MCP</strong>
          . Restart Cursor after saving.
        </p>
        <CodeBlock label="mcp.json">{MCP_CONFIG_JSON}</CodeBlock>
      </section>

      <section className="mt-10 border-t border-white/[0.06] pt-10">
        <h2 className="text-lg font-semibold tracking-tight text-[#f4f4f7]">
          Claude Desktop
        </h2>
        <p className="mt-2 text-sm text-[#8b8b9e]">
          Edit{" "}
          <code className="font-mono text-[#f4f4f7]/80">
            claude_desktop_config.json
          </code>{" "}
          — on macOS{" "}
          <code className="font-mono text-[#f4f4f7]/70">
            ~/Library/Application Support/Claude/
          </code>
          ; on Windows{" "}
          <code className="font-mono text-[#f4f4f7]/70">%APPDATA%\Claude\</code>
          .
        </p>
        <CodeBlock label="claude_desktop_config.json">{MCP_CONFIG_JSON}</CodeBlock>
      </section>

      <section className="mt-10 border-t border-white/[0.06] pt-10">
        <h2 className="text-lg font-semibold tracking-tight text-[#f4f4f7]">
          Claude Code
        </h2>
        <CodeBlock label="CLI">
          {`claude mcp add graphmyanything -- npx -y ${MCP_NPM_PACKAGE}`}
        </CodeBlock>
      </section>

      <section className="mt-10 border-t border-white/[0.06] pt-10">
        <h2 className="text-lg font-semibold tracking-tight text-[#f4f4f7]">
          Hosted API (coming)
        </h2>
        <p className="mt-2 text-sm text-[#8b8b9e]">
          The local MCP server works today. A hosted API with live chart URLs rolls
          out to waitlist and founding preorder members first —{" "}
          <Link
            href="/#waitlist"
            className="text-cyan-300/90 underline underline-offset-2 hover:text-cyan-200"
          >
            join the waitlist
          </Link>{" "}
          or see{" "}
          <Link href="/#pricing" className="text-cyan-300/90 underline underline-offset-2">
            founding preorder
          </Link>
          .
        </p>
      </section>
    </LegalPageLayout>
  );
}