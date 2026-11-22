import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getEncoding } from "js-tiktoken";
import sharp from "sharp";
import { computeSummary } from "../../packages/mcp-server/src/lib/summary.js";
import { generateInsight } from "../../packages/mcp-server/src/lib/insight.js";
import { lttb } from "../../packages/mcp-server/src/lib/lttb.js";

const enc = getEncoding("o200k_base");
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const USER_QUESTION =
  "Chart my last 90 days of MRR and tell me the trend.";

const RETRY_FACTOR = 1.15;
const SESSIONS = 30;
const POINT_SIZES = [90, 365, 5000] as const;

type ApproachId = "inline_python" | "file_python" | "gma_query_chart";

type TokenTurn = { input: string; output: string };

type SessionRow = {
  points: number;
  approach: ApproachId;
  label: string;
  inTokens: number;
  outTokens: number;
  total: number;
};

type QualityRow = {
  approach: string;
  trend: string;
  pctChange: string;
  anomalies: string;
  chartFile: string;
  extraTurnsForFull: number;
};

function generateMrrSeries(n: number): { ts: number; value: number }[] {
  const now = Math.floor(Date.now() / 1000);
  return Array.from({ length: n }, (_, i) => ({
    ts: now - (n - 1 - i) * 86400,
    value: Math.round(65_000 + i * 95 + Math.sin(i / 12) * 1_200),
  }));
}

function countTokens(text: string): number {
  return enc.encode(text).length;
}

function applyRetry(output: string): string {
  return output.slice(0, Math.floor(output.length * RETRY_FACTOR));
}

function measure(turn: TokenTurn) {
  const inTokens = countTokens(turn.input);
  const outTokens = countTokens(turn.output);
  return { inTokens, outTokens, total: inTokens + outTokens };
}

/** (a) Raw JSON in context + matplotlib — common agent anti-pattern. */
function buildInlinePython(pointCount: number): TokenTurn {
  const series = generateMrrSeries(pointCount);
  const dataJson = JSON.stringify(series);
  const input = [
    "You are a coding assistant.",
    `User: ${USER_QUESTION}`,
    `Attached CRM export (${pointCount} daily MRR rows):`,
    dataJson,
    "Write matplotlib code, print summary stats, save chart.",
  ].join("\n\n");

  const output = [
    "```python",
    "import json, matplotlib.pyplot as plt",
    `rows = json.loads('''${dataJson}''')`,
    "ys = [r['value'] for r in rows]",
    "plt.plot(ys); plt.savefig('/tmp/mrr.png')",
    `print('trend', 'up', (ys[-1]-ys[0])/ys[0]*100)`,
    "```",
    "Trend is up; latest MRR is above the window start.",
  ].join("\n");

  return { input, output: applyRetry(output) };
}

/** (b) Data on disk; agent only sees a path — fairer Python baseline. */
function buildFilePython(pointCount: number): TokenTurn {
  const input = [
    "You are a coding assistant.",
    `User: ${USER_QUESTION}`,
    "Daily MRR JSON already exists on the runner at:",
    "/data/exports/stripe_mrr_daily.json",
    `(${pointCount} rows; do not load file contents into chat)`,
    "Write Python that reads the file locally, prints min/max/mean and % change, saves PNG to disk.",
  ].join("\n\n");

  const output = [
    "```python",
    "import json, matplotlib.pyplot as plt",
    "with open('/data/exports/stripe_mrr_daily.json') as f:",
    "    rows = json.load(f)",
    "ys = [r['value'] for r in rows]",
    "print('min', min(ys), 'max', max(ys), 'mean', sum(ys)/len(ys))",
    "print('pct_change', (ys[-1]-ys[0])/ys[0]*100)",
    "plt.plot(ys); plt.savefig('/tmp/mrr.png')",
    "```",
    "Chart saved to /tmp/mrr.png. Trend up; see printed pct_change.",
  ].join("\n");

  return { input, output: applyRetry(output) };
}

/** (c) GMA query + chart — data already in SQLite from outside context. */
function buildGmaQueryChart(pointCount: number): TokenTurn {
  const series = generateMrrSeries(pointCount);
  const summary = computeSummary(series);
  const down = lttb(series, 50);
  const queryPayload = {
    metric: "stripe.mrr",
    range: "90d",
    summary,
    series: down,
  };

  const chartPayload = {
    path: "/home/user/.graphmyanything/charts/stripe.mrr.svg",
    format: "svg",
    metric: "stripe.mrr",
    points: pointCount,
  };

  const input = [
    `User: ${USER_QUESTION}`,
    "Tools (data pre-tracked in metric memory; no raw series in prompt):",
    'query({ metric: "stripe.mrr", range: "90d", token_budget: 250 })',
    'chart({ metric: "stripe.mrr", range: "90d", type: "area" })',
  ].join("\n");

  const output = [
    JSON.stringify(queryPayload),
    JSON.stringify(chartPayload),
    "See summary.trend and summary.pct_change. Chart path above (not inlined).",
  ].join("\n");

  return { input, output };
}

/** One-time bulk historical ingest via track(points[]) — agent path only. */
function buildGmaTrackBatchOnce(pointCount: number): TokenTurn {
  const series = generateMrrSeries(pointCount);
  const payload = {
    metric: "stripe.mrr",
    points: series.map((p) => ({ ts: p.ts, value: p.value })),
  };
  const input = [
    "Backfill metric memory before first chart question:",
    `track(${JSON.stringify(payload)})`,
  ].join("\n");
  const output = JSON.stringify({ ok: true, written: pointCount });
  return { input, output };
}

/** Daily single-value track if agent ingests each day (bad vs cron). */
function buildGmaTrackDaily(): TokenTurn {
  const input =
    'track({ metric: "stripe.mrr", value: 84210, tags: { source: "stripe" } })';
  const output = JSON.stringify({ ok: true, written: 1 });
  return { input, output };
}

function runSingleSession(
  pointCount: number,
  approach: ApproachId,
): SessionRow {
  const builders: Record<ApproachId, () => TokenTurn> = {
    inline_python: () => buildInlinePython(pointCount),
    file_python: () => buildFilePython(pointCount),
    gma_query_chart: () => buildGmaQueryChart(pointCount),
  };
  const labels: Record<ApproachId, string> = {
    inline_python: "Inline JSON + matplotlib",
    file_python: "File-based Python (data off-context)",
    gma_query_chart: "GMA query + chart",
  };
  const m = measure(builders[approach]());
  return {
    points: pointCount,
    approach,
    label: labels[approach],
    inTokens: m.inTokens,
    outTokens: m.outTokens,
    total: m.total,
  };
}

function buildQualityMatrix(pointCount: number): QualityRow[] {
  const series = generateMrrSeries(pointCount);
  const summary = computeSummary(series);
  const insight = generateInsight("stripe.mrr", series, "90d");
  const hasAnomalies = insight.anomalies.length > 0;

  return [
    {
      approach: "Inline JSON + matplotlib",
      trend: "Yes (printed / prose, 1 turn)",
      pctChange: "Yes (code prints %)",
      anomalies: "No (needs extra analysis turn)",
      chartFile: "PNG path in reply",
      extraTurnsForFull: 1,
    },
    {
      approach: "File-based Python",
      trend: "Yes (prints + prose, 1 turn)",
      pctChange: "Yes (printed stats)",
      anomalies: "No (no robust detector in template)",
      chartFile: "PNG on disk",
      extraTurnsForFull: 1,
    },
    {
      approach: "GMA query + chart",
      trend: `Yes (summary.trend=${summary.trend})`,
      pctChange: `Yes (summary.pct_change=${summary.pct_change})`,
      anomalies: "No on query alone",
      chartFile: "SVG path (not inlined)",
      extraTurnsForFull: 1,
    },
    {
      approach: "GMA + insight (optional 3rd tool)",
      trend: "Yes",
      pctChange: "Yes",
      anomalies: hasAnomalies
        ? `Yes (${insight.anomalies.length} flagged, 1 extra tool)`
        : "Yes (tool ready; none in synthetic series)",
      chartFile: "Same as query + chart",
      extraTurnsForFull: 0,
    },
  ];
}

type IngestionScenario = {
  name: string;
  description: string;
  tokensInQuestionFlow: number;
  amortizedPerSession: number;
};

function ingestionScenarios(pointCount: number): IngestionScenario[] {
  const batch = measure(buildGmaTrackBatchOnce(pointCount));
  const daily = measure(buildGmaTrackDaily());
  return [
    {
      name: "n8n/cron track (recommended)",
      description: "Daily track on worker; agent only queries.",
      tokensInQuestionFlow: 0,
      amortizedPerSession: 0,
    },
    {
      name: "One-time agent backfill",
      description: `Single track(points[${pointCount}]) before first question.`,
      tokensInQuestionFlow: batch.total,
      amortizedPerSession: Math.round(batch.total / SESSIONS),
    },
    {
      name: "Agent track every day (anti-pattern)",
      description: `${SESSIONS}× daily track() in agent sessions.`,
      tokensInQuestionFlow: daily.total * SESSIONS,
      amortizedPerSession: daily.total,
    },
  ];
}

function pctSaved(base: number, value: number): number {
  if (base <= 0) return 0;
  return Math.round((1 - value / base) * 1000) / 10;
}

function pctDeltaLabel(base: number, value: number): string {
  const saved = pctSaved(base, value);
  if (saved > 0) return `−${saved}%`;
  if (saved < 0) return `+${Math.abs(saved)}% more`;
  return "±0%";
}

function formatNum(n: number): string {
  return n.toLocaleString("en-US");
}

function renderChart(
  single90: SessionRow[],
  multi30: { approach: ApproachId; label: string; total: number }[],
): string {
  const W = 1200;
  const H = 880;
  const bg = "#06060a";
  const muted = "#8b8b9e";
  const fg = "#f4f4f7";
  const colors: Record<ApproachId, { fill: string; stroke: string }> = {
    inline_python: { fill: "#fb7185", stroke: "#f43f5e" },
    file_python: { fill: "#fbbf24", stroke: "#d97706" },
    gma_query_chart: { fill: "#34d399", stroke: "#10b981" },
  };

  const panelTop = 120;
  const panelH = 300;
  const barH = 52;
  const gap = 18;

  function logW(value: number, maxLog: number, innerW: number): number {
    const v = Math.max(1, value);
    const log = Math.log10(v);
    return (log / maxLog) * innerW;
  }

  const maxSingle = Math.max(...single90.map((r) => r.total));
  const maxMulti = Math.max(...multi30.map((r) => r.total));
  const maxLog = Math.log10(Math.max(maxSingle, maxMulti, 10));
  const innerW = W - 320;
  const left = 280;

  let y = panelTop;
  const bars1: string[] = [];
  const order: ApproachId[] = [
    "inline_python",
    "file_python",
    "gma_query_chart",
  ];
  for (const id of order) {
    const row = single90.find((r) => r.approach === id)!;
    const w = logW(row.total, maxLog, innerW);
    const c = colors[id];
    const inlineBase = single90.find((r) => r.approach === "inline_python")!
      .total;
    const fileBase = single90.find((r) => r.approach === "file_python")!.total;
    const saveVsInline =
      id === "gma_query_chart" ? pctDeltaLabel(inlineBase, row.total) : null;
    const saveVsFile =
      id === "gma_query_chart" ? pctDeltaLabel(fileBase, row.total) : null;

    bars1.push(`
  <text x="20" y="${y + 34}" fill="${fg}" font-family="system-ui,sans-serif" font-size="14" font-weight="500">${escapeXml(row.label)}</text>
  <rect x="${left}" y="${y}" width="${Math.max(4, w).toFixed(1)}" height="${barH}" rx="8" fill="url(#grad-${id})" stroke="${c.stroke}" stroke-opacity="0.35"/>
  <text x="${(left + w + 12).toFixed(1)}" y="${y + 34}" fill="${fg}" font-family="ui-monospace,monospace" font-size="15" font-weight="600">${formatNum(row.total)}</text>`);

    if (saveVsInline != null && saveVsFile != null) {
      bars1.push(`
  <text x="${left}" y="${y + barH + 14}" fill="#22d3ee" font-family="ui-monospace,monospace" font-size="11">${saveVsInline} vs inline · ${saveVsFile} vs file Python</text>`);
    }
    y += barH + gap + (saveVsInline != null ? 22 : 0);
  }

  const multiTitleY = y + 48;
  y = multiTitleY + 36;
  const bars2: string[] = [];
  for (const row of multi30) {
    const id = row.approach;
    const w = logW(row.total, maxLog, innerW);
    const c = colors[id];
    bars2.push(`
  <text x="20" y="${y + 34}" fill="${fg}" font-family="system-ui,sans-serif" font-size="14" font-weight="500">${escapeXml(row.label)}</text>
  <rect x="${left}" y="${y}" width="${Math.max(4, w).toFixed(1)}" height="${barH}" rx="8" fill="url(#grad-${id})" stroke="${c.stroke}" stroke-opacity="0.35"/>
  <text x="${(left + w + 12).toFixed(1)}" y="${y + 34}" fill="${fg}" font-family="ui-monospace,monospace" font-size="15" font-weight="600">${formatNum(row.total)}</text>`);
    y += barH + gap;
  }

  const chips = order
    .map(
      (id, i) => `
  <g transform="translate(${24 + i * 250}, 78)">
    <rect width="230" height="28" rx="14" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)"/>
    <circle cx="18" cy="14" r="6" fill="url(#grad-${id})"/>
    <text x="34" y="18" fill="${fg}" font-size="12" font-family="system-ui,sans-serif">${escapeXml(
      { inline_python: "Inline JSON", file_python: "File Python", gma_query_chart: "GMA query+chart" }[id],
    )}</text>
  </g>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="grad-inline_python" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#fb7185"/><stop offset="100%" stop-color="#f43f5e"/>
    </linearGradient>
    <linearGradient id="grad-file_python" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#fcd34d"/><stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
    <linearGradient id="grad-gma_query_chart" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#8b5cf6"/><stop offset="45%" stop-color="#22d3ee"/><stop offset="100%" stop-color="#34d399"/>
    </linearGradient>
    <linearGradient id="title-grad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#8b5cf6"/><stop offset="50%" stop-color="#22d3ee"/><stop offset="100%" stop-color="#34d399"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="${bg}" rx="16"/>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="15" fill="none" stroke="url(#title-grad)" stroke-opacity="0.35"/>
  <text x="24" y="42" fill="url(#title-grad)" font-family="system-ui,sans-serif" font-size="26" font-weight="700">Token benchmark · one chart question</text>
  <text x="24" y="64" fill="${muted}" font-family="system-ui,sans-serif" font-size="13">"${USER_QUESTION}" · js-tiktoken o200k_base · log-scaled bar width</text>
  ${chips}
  <text x="24" y="${panelTop - 12}" fill="${fg}" font-size="16" font-weight="600" font-family="system-ui,sans-serif">Single session (90 daily points)</text>
  <line x1="left" y1="${panelTop + 230}" x2="${W - 24}" y2="${panelTop + 230}" stroke="rgba(255,255,255,0.08)"/>
  ${bars1.join("")}
  <text x="24" y="${multiTitleY}" fill="${fg}" font-size="16" font-weight="600" font-family="system-ui,sans-serif">${SESSIONS} sessions (same question daily; GMA data persists)</text>
  <text x="24" y="${multiTitleY + 18}" fill="${muted}" font-size="12" font-family="system-ui,sans-serif">Inline Python re-loads full JSON each time; file Python re-runs script; GMA re-queries memory (n8n ingestion = 0 tokens/session)</text>
  ${bars2.join("")}
  <text x="24" y="${H - 24}" fill="${muted}" font-size="11" font-family="system-ui,sans-serif">Generated ${new Date().toISOString().slice(0, 10)} · graphmyanything.com · reproducible: npm run run</text>
</svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

// --- Run ---
const singleRows = POINT_SIZES.flatMap((n) =>
  (["inline_python", "file_python", "gma_query_chart"] as const).map((a) =>
    runSingleSession(n, a),
  ),
);

const single90 = singleRows.filter((r) => r.points === 90);
const file90 = single90.find((r) => r.approach === "file_python")!;
const gma90 = single90.find((r) => r.approach === "gma_query_chart")!;
const inline90 = single90.find((r) => r.approach === "inline_python")!;

const multi30 = (["inline_python", "file_python", "gma_query_chart"] as const).map(
  (a) => {
    const per = single90.find((r) => r.approach === a)!.total;
    const label =
      a === "inline_python"
        ? "Inline JSON + matplotlib"
        : a === "file_python"
          ? "File-based Python"
          : "GMA query + chart";
    return { approach: a, label, total: per * SESSIONS };
  },
);

const ingest = ingestionScenarios(90);
const quality = buildQualityMatrix(90);
const batchTrack = measure(buildGmaTrackBatchOnce(90));

const headlineMulti = multi30.find((m) => m.approach === "gma_query_chart")!;
const fileMulti = multi30.find((m) => m.approach === "file_python")!;
const inlineMulti = multi30[0].total;
const row5000 = singleRows.filter((r) => r.points === 5000);
const inline5k = row5000.find((r) => r.approach === "inline_python")!.total;
const gma5k = row5000.find((r) => r.approach === "gma_query_chart")!.total;

const tableSingle = POINT_SIZES.map((n) => {
  const rows = singleRows.filter((r) => r.points === n);
  const inline = rows.find((r) => r.approach === "inline_python")!;
  const file = rows.find((r) => r.approach === "file_python")!;
  const gma = rows.find((r) => r.approach === "gma_query_chart")!;
  return `| ${n} | ${formatNum(inline.total)} | ${formatNum(file.total)} | ${formatNum(gma.total)} | ${pctDeltaLabel(inline.total, gma.total)} | ${pctDeltaLabel(file.total, gma.total)} |`;
}).join("\n");

const md = `# Token benchmark (hardened)

## Headline (defensible)

**What we can claim:** When agents **paste the series into chat** (inline JSON + matplotlib), cost explodes with data size — **${formatNum(inline90.total)}** tokens at 90 points vs **${formatNum(gma90.total)}** for GMA (\`${pctDeltaLabel(inline90.total, gma90.total)}\`), and **${formatNum(inline5k)}** vs **${formatNum(gma5k)}** at 5,000 points (\`${pctDeltaLabel(inline5k, gma5k)}\`). GMA \`query\`+\`chart\` stays ~flat because history lives in metric memory, not the prompt.

**What we cannot claim:** Minimal **file-based Python** (data on disk, never loaded into context) is **${formatNum(file90.total)}** tokens/session — **${pctDeltaLabel(file90.total, gma90.total)}** than GMA on this benchmark. That path is the honest ceiling; GMA trades higher per-question tokens for MCP ergonomics, persistent memory, LTTB summaries, and optional \`insight\` without re-writing scripts.

**${SESSIONS}-session persistence:** Inline-json totals **${formatNum(inlineMulti)}** tokens (re-attaches full JSON each day) vs GMA **${formatNum(headlineMulti.total)}** (\`${pctDeltaLabel(inlineMulti, headlineMulti.total)}\`) with **n8n/cron \`track\`** ingestion (**0** ingest tokens per session). File-Python cumulative: **${formatNum(fileMulti.total)}** (still lowest token count; agent re-runs script each time).

**Prompt:** "${USER_QUESTION}"

**Tokenizer:** \`js-tiktoken\` / \`o200k_base\`

## Single-session totals (input + output, incl. ${RETRY_FACTOR}× retry on Python paths)

| Points | Inline JSON + mpl | File Python | GMA query+chart | GMA vs inline | GMA vs file |
|--------|-------------------|-------------|-----------------|---------------|-------------|
${tableSingle}

## GMA ingestion (outside the chart question)

| Scenario | Tokens in agent flow | Per-session amortized (${SESSIONS} sessions) |
|----------|----------------------|-----------------------------------------------|
${ingest
  .map(
    (s) =>
      `| ${s.name} | ${formatNum(s.tokensInQuestionFlow)} | ${formatNum(s.amortizedPerSession)} |`,
  )
  .join("\n")}

One-time \`track(points[90])\` backfill costs **${formatNum(batchTrack.total)}** tokens (counted separately from query/chart). **Recommended:** n8n/cron \`track\` so chart questions stay at **${formatNum(gma90.total)}** tokens.

## ${SESSIONS}-session cumulative (90-point window; no re-ingest for GMA)

| Approach | Per session | × ${SESSIONS} sessions |
|----------|-------------|----------------------|
| Inline JSON + matplotlib | ${formatNum(inline90.total)} | **${formatNum(multi30[0].total)}** |
| File-based Python | ${formatNum(file90.total)} | **${formatNum(fileMulti.total)}** |
| GMA query + chart (n8n ingest) | ${formatNum(gma90.total)} | **${formatNum(headlineMulti.total)}** |

## Answer quality (one turn unless noted)

| Approach | Trend | % change | Anomalies | Chart artifact | Extra turns for anomalies |
|----------|-------|----------|-----------|----------------|---------------------------|
${quality
  .map(
    (q) =>
      `| ${q.approach} | ${q.trend} | ${q.pctChange} | ${q.anomalies} | ${q.chartFile} | ${q.extraTurnsForFull} |`,
  )
  .join("\n")}

## Caveats

- **Synthetic MRR** series; point counts (90 / 365 / 5000) scale **payload size** for inline JSON, not always literal calendar windows.
- **Python outputs** are representative templates; real agents vary in verbosity, libraries, and retries (we apply **${RETRY_FACTOR}×** on Python output only).
- **File Python** assumes the model respects "do not load file into chat"; cheating by reading the file into context collapses toward the inline baseline.
- **GMA \`chart\`** returns a **path**, not image bytes — compared fairly to Python saving PNG on disk, not base64 in chat.
- **Anomalies** on GMA require \`insight\` (modeled as +1 tool turn); \`query\` alone matches Python on anomalies (none without extra work).
- **Tokenizer** is \`o200k_base\`; counts differ slightly on Claude/Gemini tokenizers (usually within a few %).
- This measures **LLM context/tool tokens**, not local CPU, Stripe API, or n8n runtime.

## Reproduce

\`\`\`bash
cd benchmarks/token-benchmark
npm install
npm run run
\`\`\`

From repo root: \`npm run benchmark:tokens\`

Outputs: \`results.md\`, \`token-benchmark.svg\`, \`token-benchmark.png\` (1200×${880} @2× for social).

![Token benchmark](./token-benchmark.svg)
`;

const outDir = __dirname;
const svg = renderChart(single90, multi30);
const svgPath = path.join(outDir, "token-benchmark.svg");
const pngPath = path.join(outDir, "token-benchmark.png");
fs.writeFileSync(svgPath, svg, "utf8");
fs.writeFileSync(path.join(outDir, "results.md"), md, "utf8");

await sharp(Buffer.from(svg)).resize(2400).png().toFile(pngPath);

console.log("Wrote results.md, token-benchmark.svg, token-benchmark.png");
console.log(
  `Headline 90d: inline=${inline90.total} gma=${gma90.total} (${pctDeltaLabel(inline90.total, gma90.total)}) file=${file90.total} (${pctDeltaLabel(file90.total, gma90.total)})`,
);
console.log(
  `Headline 30 sessions: file=${fileMulti.total} gma=${headlineMulti.total}`,
);
for (const r of single90) {
  console.log(`${r.label}: ${r.total}`);
}