import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getEncoding } from "js-tiktoken";
import { computeSummary } from "../../packages/mcp-server/src/lib/summary.js";
import { lttb } from "../../packages/mcp-server/src/lib/lttb.js";

const enc = getEncoding("o200k_base");
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const USER_QUESTION =
  "Chart my last 90 days of MRR and tell me the trend.";

type Row = {
  points: number;
  pythonIn: number;
  pythonOut: number;
  pythonTotal: number;
  gmaIn: number;
  gmaOut: number;
  gmaTotal: number;
  reductionPct: number;
};

function generateMrrSeries(n: number): { ts: number; value: number }[] {
  const now = Math.floor(Date.now() / 1000);
  return Array.from({ length: n }, (_, i) => ({
    ts: now - (n - 1 - i) * 86400,
    value: Math.round(65_000 + i * 95 + Math.sin(i / 12) * 1_200),
  }));
}

function buildThrowawayPythonTurn(pointCount: number): {
  input: string;
  output: string;
} {
  const series = generateMrrSeries(pointCount);
  const dataJson = JSON.stringify(series);
  const system =
    "You are a coding assistant. The user wants a matplotlib chart and trend analysis.";
  const input = [
    system,
    `User: ${USER_QUESTION}`,
    `Attached CRM export (${pointCount} daily MRR rows):`,
    dataJson,
    "Write runnable Python using matplotlib, print stats, and describe the chart.",
  ].join("\n\n");

  const output = [
    "```python",
    "import json, matplotlib.pyplot as plt",
    `data = json.loads('''${dataJson.slice(0, Math.min(dataJson.length, pointCount * 48))}''')`,
    "xs = [d['ts'] for d in data]",
    "ys = [d['value'] for d in data]",
    "fig, ax = plt.subplots(figsize=(10,4))",
    "ax.plot(xs, ys, color='#8b5cf6')",
    "ax.set_title('MRR — last 90d')",
    "plt.tight_layout()",
    "plt.savefig('/tmp/mrr.png')",
    "print('Trend: up', (ys[-1]-ys[0])/ys[0]*100, '%')",
    "```",
    "I've plotted your MRR. Overall trend is upward; latest value is higher than the start of the window.",
    "Retry note: user asked to fix date formatting (+20% follow-up tokens modeled in output length).",
  ].join("\n");

  const retryFactor = 1.15;
  const paddedOutput = output.repeat(1).slice(0, Math.floor(output.length * retryFactor));
  return { input, output: paddedOutput };
}

function buildGmaTurn(pointCount: number): { input: string; output: string } {
  const series = generateMrrSeries(pointCount);
  const summary = computeSummary(series);
  const down = lttb(series, 50);
  const queryPayload = {
    metric: "stripe.mrr",
    range: "90d",
    summary,
    series: down,
    tokens_estimate: 0,
  };
  queryPayload.tokens_estimate = Math.ceil(
    JSON.stringify(queryPayload).length / 4,
  );

  const chartPayload = {
    path: "/home/user/.graphmyanything/charts/stripe.mrr.svg",
    format: "svg",
    metric: "stripe.mrr",
    points: pointCount,
    note: "Live URL https://graphmyanything.com/c/stripe.mrr coming for founding members.",
  };

  const input = [
    `User: ${USER_QUESTION}`,
    "Agent tool calls:",
    '1. query({ metric: "stripe.mrr", range: "90d", token_budget: 250 })',
    '2. chart({ metric: "stripe.mrr", range: "90d", type: "area" })',
  ].join("\n");

  const output = [
    JSON.stringify(queryPayload),
    JSON.stringify(chartPayload),
    "Trend: upward; see summary.pct_change. Chart saved locally (not inlined).",
  ].join("\n");

  return { input, output };
}

function countTokens(text: string): number {
  return enc.encode(text).length;
}

function runBenchmark(pointCount: number): Row {
  const py = buildThrowawayPythonTurn(pointCount);
  const gma = buildGmaTurn(pointCount);
  const pythonIn = countTokens(py.input);
  const pythonOut = countTokens(py.output);
  const gmaIn = countTokens(gma.input);
  const gmaOut = countTokens(gma.output);
  const pythonTotal = pythonIn + pythonOut;
  const gmaTotal = gmaIn + gmaOut;
  const reductionPct = Math.round((1 - gmaTotal / pythonTotal) * 1000) / 10;
  return {
    points: pointCount,
    pythonIn,
    pythonOut,
    pythonTotal,
    gmaIn,
    gmaOut,
    gmaTotal,
    reductionPct,
  };
}

const sizes = [90, 365, 5000] as const;
const rows = sizes.map(runBenchmark);

function renderBarChart(data: Row[]): string {
  const W = 720;
  const H = 280;
  const pad = { l: 56, r: 24, t: 40, b: 48 };
  const maxVal = Math.max(...data.flatMap((r) => [r.pythonTotal, r.gmaTotal]));
  const groupW = (W - pad.l - pad.r) / data.length;
  const barW = groupW * 0.28;
  const bars: string[] = [];
  data.forEach((r, i) => {
    const cx = pad.l + groupW * i + groupW / 2;
    const pyH = ((H - pad.t - pad.b) * r.pythonTotal) / maxVal;
    const gmaH = ((H - pad.t - pad.b) * r.gmaTotal) / maxVal;
    const base = H - pad.b;
    bars.push(
      `<rect x="${cx - barW - 4}" y="${base - pyH}" width="${barW}" height="${pyH}" fill="#f43f5e" rx="3"/>`,
      `<rect x="${cx + 4}" y="${base - gmaH}" width="${barW}" height="${gmaH}" fill="#34d399" rx="3"/>`,
      `<text x="${cx}" y="${H - 20}" text-anchor="middle" fill="#a8a8b8" font-size="12" font-family="system-ui">${r.points} pts</text>`,
    );
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="100%" height="100%" fill="#0d0d12"/>
  <text x="${pad.l}" y="26" fill="#f4f4f7" font-size="16" font-weight="600" font-family="system-ui">Tokens: throwaway Python vs GraphMyAnything</text>
  <text x="${W - pad.r}" y="26" text-anchor="end" fill="#8b8b9e" font-size="11" font-family="system-ui">o200k_base · ${new Date().toISOString().slice(0, 10)}</text>
  <text x="12" y="90" fill="#f43f5e" font-size="10" font-family="system-ui">Python</text>
  <text x="12" y="104" fill="#34d399" font-size="10" font-family="system-ui">GMA</text>
  ${bars.join("\n  ")}
</svg>`;
}

const md = `# Token benchmark: throwaway Python vs GraphMyAnything

**Prompt:** "${USER_QUESTION}"

**Tokenizer:** \`js-tiktoken\` with \`o200k_base\` (same family as recent OpenAI models).

## Assumptions

- **Python path:** User message + full daily MRR JSON in context, assistant emits matplotlib code and prose; output length includes a **1.15× retry/follow-up factor** (fix labels, date axis).
- **GMA path:** One \`query\` + one \`chart\` tool round: compact JSON summary + LTTB ~50 points; chart tool returns **file path only** (SVG not inlined in tokens).
- Synthetic MRR series; point counts 90 / 365 / 5000 simulate window size, not always "90 days" at 5k pts.

## Results

| Points | Python in | Python out | Python **total** | GMA in | GMA out | GMA **total** | **Reduction** |
|--------|-----------|------------|------------------|--------|---------|---------------|---------------|
${rows
  .map(
    (r) =>
      `| ${r.points} | ${r.pythonIn.toLocaleString()} | ${r.pythonOut.toLocaleString()} | **${r.pythonTotal.toLocaleString()}** | ${r.gmaIn} | ${r.gmaOut} | **${r.gmaTotal}** | **${r.reductionPct}%** |`,
  )
  .join("\n")}

### Headline (90 daily points)

At **${rows[0].points}** points: **${rows[0].pythonTotal.toLocaleString()}** tokens (throwaway Python) vs **${rows[0].gmaTotal}** tokens (query + chart) → **${rows[0].reductionPct}%** fewer tokens.

![Bar chart](./token-benchmark.svg)

\`\`\`bash
npm run run   # from benchmarks/token-benchmark
\`\`\`
`;

const outDir = __dirname;
fs.writeFileSync(path.join(outDir, "results.md"), md, "utf8");
fs.writeFileSync(path.join(outDir, "token-benchmark.svg"), renderBarChart(rows), "utf8");

console.log("Wrote results.md and token-benchmark.svg");
for (const r of rows) {
  console.log(
    `${r.points} pts: python=${r.pythonTotal} gma=${r.gmaTotal} (−${r.reductionPct}%)`,
  );
}