import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getEncoding } from "js-tiktoken";
import sharp from "sharp";
import { computeSummary } from "../../packages/mcp-server/src/lib/summary.js";
import { generateInsight } from "../../packages/mcp-server/src/lib/insight.js";
import {
  ASSUMPTIONS,
  SHARED_FINAL_ANSWER,
  SHARED_USER_CONTEXT,
} from "./e2e-assumptions.js";
import { buildAllE2EFlows } from "./e2e-flows.js";
import { buildGmaPayloads } from "./gma-payloads.js";
import {
  gmaToolDefsJson,
  PYTHON_HARNESS_TOOLS_JSON,
} from "./tool-definitions.js";
import type { E2EFlow } from "./e2e-assumptions.js";

const enc = getEncoding("o200k_base");
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const USER_QUESTION = ASSUMPTIONS.userQuestion;
const SESSIONS = ASSUMPTIONS.sessions;
const POINT_COUNT = ASSUMPTIONS.pointCount;
const RETRY_FACTOR = ASSUMPTIONS.minimalOutputRetryFactor;

type ChartBar = {
  id: string;
  label: string;
  total: number;
  gradientId: string;
  callout?: string;
  dashed?: boolean;
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

type MeasuredStep = E2EFlow["steps"][number] & {
  inTokens: number;
  outTokens: number;
  total: number;
};

type MeasuredFlow = {
  flow: E2EFlow;
  steps: MeasuredStep[];
  inTokens: number;
  outTokens: number;
  total: number;
  turns: number;
  toolCalls: number;
};

function toolDefOverhead(base: MeasuredFlow, defTokens: number) {
  return {
    base: base.total,
    perTurn: Math.round(base.total + defTokens * base.turns),
    onceCached: base.total + defTokens,
  };
}

function measureFlow(flow: E2EFlow): MeasuredFlow {
  const steps: MeasuredStep[] = flow.steps.map((step) => {
    const w = step.weight ?? 1;
    const inTokens = Math.round(countTokens(step.contextInput) * w);
    const outTokens = Math.round(countTokens(step.modelOutput) * w);
    return { ...step, inTokens, outTokens, total: inTokens + outTokens };
  });
  const inTokens = steps.reduce((a, s) => a + s.inTokens, 0);
  const outTokens = steps.reduce((a, s) => a + s.outTokens, 0);
  const toolCalls = steps.reduce((a, s) => a + s.toolCalls * (s.weight ?? 1), 0);
  const turns = steps.reduce((a, s) => a + (s.weight ?? 1), 0);
  return {
    flow,
    steps,
    inTokens,
    outTokens,
    total: inTokens + outTokens,
    turns: Math.round(turns * 10) / 10,
    toolCalls: Math.round(toolCalls * 10) / 10,
  };
}

function breakdownSection(m: MeasuredFlow): string {
  const rows = m.steps
    .map(
      (s) =>
        `| ${s.name} | ${formatNum(s.inTokens)} | ${formatNum(s.outTokens)} | ${formatNum(s.total)} |`,
    )
    .join("\n");
  return `### ${m.flow.label}\n\n| Step | In (context) | Out (model) | Total |\n|------|----------------|-------------|-------|\n${rows}\n| **Sum** | **${formatNum(m.inTokens)}** | **${formatNum(m.outTokens)}** | **${formatNum(m.total)}** |`;
}

function costUsd(inTokens: number, outTokens: number): number {
  const { inputPerMillion, outputPerMillion } = ASSUMPTIONS.costModel;
  return (
    (inTokens / 1_000_000) * inputPerMillion +
    (outTokens / 1_000_000) * outputPerMillion
  );
}

/** Best-case Python: final code-gen turn only (Carlos's lower bound). */
function buildFilePythonBestCase(pointCount: number) {
  const input = [
    SHARED_USER_CONTEXT,
    "Daily MRR JSON on disk at /data/exports/stripe_mrr_daily.json",
    `(${pointCount} rows; do not load into chat)`,
    "Write short Python reading file, stats, save PNG.",
  ].join("\n\n");
  const output = [
    "```python",
    "import json, matplotlib.pyplot as plt",
    "rows=json.load(open('/data/exports/stripe_mrr_daily.json'))",
    "ys=[r['value'] for r in rows]",
    "plt.plot(ys); plt.savefig('/tmp/mrr.png')",
    "print('pct_change',(ys[-1]-ys[0])/ys[0]*100)",
    "```",
    SHARED_FINAL_ANSWER,
  ].join("\n");
  const out = output.slice(0, Math.floor(output.length * RETRY_FACTOR));
  const inTokens = countTokens(input);
  const outTokens = countTokens(out);
  return {
    inTokens,
    outTokens,
    total: inTokens + outTokens,
    turns: 1,
    toolCalls: 0,
  };
}

function pctSaved(base: number, value: number): number {
  if (base <= 0) return 0;
  return Math.round((1 - value / base) * 1000) / 10;
}

function pctDeltaLabel(base: number, value: number): string {
  const saved = pctSaved(base, value);
  if (saved > 0) return `${saved}% fewer`;
  if (saved < 0) return `${Math.abs(saved)}% more`;
  return "same";
}

function vsPhrase(base: number, value: number): string {
  return `${formatNum(value)} vs ${formatNum(base)} (${pctDeltaLabel(base, value)})`;
}

function formatNum(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

function renderChart(primary: ChartBar[], secondary: ChartBar[]): string {
  const W = 1200;
  const H = 920;
  const bg = "#06060a";
  const muted = "#8b8b9e";
  const fg = "#f4f4f7";
  const left = 300;
  const innerW = W - left - 48;
  const barH = 48;
  const gap = 14;
  const legendY = 76;
  const legendRowH = 36;
  const panel1TitleY = legendY + legendRowH + 28;
  let y = panel1TitleY + 26;

  const maxPrimary = Math.max(...primary.map((b) => b.total), 10);
  const maxSecondary = Math.max(...secondary.map((b) => b.total), 10);

  function linearW(value: number, panelMax: number): number {
    return (value / panelMax) * innerW;
  }

  function barBlock(bar: ChartBar, yPos: number, panelMax: number): string {
    const w = linearW(bar.total, panelMax);
    const end = left + w;
    const labelInside = end > left + 90;
    const labelRight = end + 88 > W - 8;
    const label = labelInside
      ? `<text x="${(end - 10).toFixed(1)}" y="${yPos + 31}" text-anchor="end" fill="#06060a" font-family="ui-monospace,monospace" font-size="13" font-weight="700">${formatNum(bar.total)}</text>`
      : labelRight
        ? `<text x="${(W - 12).toFixed(1)}" y="${yPos + 31}" text-anchor="end" fill="${fg}" font-family="ui-monospace,monospace" font-size="12" font-weight="600">${formatNum(bar.total)}</text>`
        : `<text x="${(end + 10).toFixed(1)}" y="${yPos + 31}" fill="${fg}" font-family="ui-monospace,monospace" font-size="13" font-weight="600">${formatNum(bar.total)}</text>`;
    const dash = bar.dashed
      ? 'stroke-dasharray="6 4" stroke="rgba(255,255,255,0.35)" stroke-width="1"'
      : "";
    const callout = bar.callout
      ? `<text x="${left}" y="${yPos + barH + 14}" fill="#22d3ee" font-family="ui-monospace,monospace" font-size="11">${escapeXml(bar.callout)}</text>`
      : "";
    return `
  <text x="16" y="${yPos + 31}" fill="${fg}" font-family="system-ui,sans-serif" font-size="13" font-weight="500">${escapeXml(bar.label)}</text>
  <rect x="${left}" y="${yPos}" width="${Math.max(6, w).toFixed(1)}" height="${barH}" rx="8" fill="url(#grad-${bar.gradientId})" ${dash}/>
  ${label}
  ${callout}`;
  }

  const legends = [
    { id: "file_e2e", label: "Python E2E" },
    { id: "inline_e2e", label: "Inline E2E" },
    { id: "gma", label: "GMA" },
    { id: "best", label: "Best-case Python" },
  ];

  const chips = legends
    .map(
      (lg, i) => `
  <g transform="translate(${24 + i * 186}, ${legendY})">
    <rect width="172" height="26" rx="13" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)"/>
    <circle cx="16" cy="13" r="5" fill="url(#grad-${lg.id})"/>
    <text x="30" y="17" fill="${fg}" font-size="11" font-family="system-ui,sans-serif">${escapeXml(lg.label)}</text>
  </g>`,
    )
    .join("");

  const bars1: string[] = [];
  for (const bar of primary) {
    bars1.push(barBlock(bar, y, maxPrimary));
    y += barH + gap + (bar.callout ? 18 : 0);
  }

  const panel2Y = y + 24;
  y = panel2Y + 28;
  const bars2: string[] = [];
  for (const bar of secondary) {
    bars2.push(barBlock(bar, y, maxSecondary));
    y += barH + gap + (bar.callout ? 18 : 0);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="grad-file_e2e" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#fcd34d"/><stop offset="100%" stop-color="#f59e0b"/></linearGradient>
    <linearGradient id="grad-inline_e2e" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#fb7185"/><stop offset="100%" stop-color="#f43f5e"/></linearGradient>
    <linearGradient id="grad-gma" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#8b5cf6"/><stop offset="45%" stop-color="#22d3ee"/><stop offset="100%" stop-color="#34d399"/></linearGradient>
    <linearGradient id="grad-best" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#6b7280"/><stop offset="100%" stop-color="#9ca3af"/></linearGradient>
    <linearGradient id="title-grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#8b5cf6"/><stop offset="50%" stop-color="#22d3ee"/><stop offset="100%" stop-color="#34d399"/></linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="${bg}" rx="16"/>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="15" fill="none" stroke="url(#title-grad)" stroke-opacity="0.35"/>
  <text x="24" y="40" fill="url(#title-grad)" font-family="system-ui,sans-serif" font-size="24" font-weight="700">End-to-end agent tokens · one chart question</text>
  <text x="24" y="62" fill="${muted}" font-family="system-ui,sans-serif" font-size="12">o200k_base · linear scale · excl. tool defs · graphmyanything.com</text>
  <rect x="20" y="${legendY - 14}" width="${W - 40}" height="${legendRowH}" rx="10" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)"/>
  ${chips}
  <text x="24" y="${panel1TitleY}" fill="${fg}" font-size="15" font-weight="600" font-family="system-ui,sans-serif">Single question (90 points)</text>
  ${bars1.join("")}
  <text x="24" y="${panel2Y}" fill="${fg}" font-size="15" font-weight="600" font-family="system-ui,sans-serif">${SESSIONS} warm repeats (re-discovery / re-query each session)</text>
  ${bars2.join("")}
  <text x="24" y="${H - 22}" fill="${muted}" font-size="11" font-family="system-ui,sans-serif">graphmyanything.com · npm run run · ${new Date().toISOString().slice(0, 10)}</text>
</svg>`;
}

// --- Data ---
const series = generateMrrSeries(POINT_COUNT);
const dataJson = JSON.stringify(series);
const payloads = buildGmaPayloads(series);
const e2eFlows = buildAllE2EFlows(dataJson, payloads);
const measured = e2eFlows.map(measureFlow);

const byId = (id: string) => measured.find((m) => m.flow.id === id)!;
const fileCold = byId("python_file_e2e_cold");
const fileWarm = byId("python_file_e2e_warm");
const inlineCold = byId("python_inline_e2e_cold");
const inlineWarm = byId("python_inline_e2e_warm");
const gmaLean = byId("gma_lean");
const gmaFull = byId("gma_full");
const bestCase = buildFilePythonBestCase(POINT_COUNT);

const gmaDefTokens = countTokens(gmaToolDefsJson());
const pyDefTokens = countTokens(PYTHON_HARNESS_TOOLS_JSON);
const fileColdDefs = toolDefOverhead(fileCold, pyDefTokens);
const gmaLeanDefs = toolDefOverhead(gmaLean, gmaDefTokens);
const primaryBarsSocial: ChartBar[] = [
  {
    id: "python_inline_e2e_cold",
    label: "Inline JSON E2E",
    total: inlineCold.total,
    gradientId: "inline_e2e",
  },
  {
    id: "python_file_e2e_cold",
    label: "Python file E2E",
    total: fileCold.total,
    gradientId: "file_e2e",
  },
  {
    id: "gma_lean",
    label: "GMA lean",
    total: gmaLean.total,
    gradientId: "gma",
    callout: `${pctDeltaLabel(fileCold.total, gmaLean.total)} vs file E2E`,
  },
  {
    id: "file_best",
    label: "Best-case Python (lower bound)",
    total: bestCase.total,
    gradientId: "best",
    dashed: true,
  },
];

const secondaryBarsSocial: ChartBar[] = [
  {
    id: "multi_inline_warm",
    label: "Inline E2E × 30",
    total: inlineWarm.total * SESSIONS,
    gradientId: "inline_e2e",
  },
  {
    id: "multi_file_cold",
    label: "Python file E2E × 30",
    total: fileCold.total * SESSIONS,
    gradientId: "file_e2e",
  },
  {
    id: "multi_gma",
    label: "GMA lean × 30",
    total: gmaLean.total * SESSIONS,
    gradientId: "gma",
    callout: `${pctDeltaLabel(fileCold.total * SESSIONS, gmaLean.total * SESSIONS)} vs file ×30`,
  },
];

const assumptionsRows = [
  ["User prompt", `"${USER_QUESTION}"`],
  ["Data size", `${POINT_COUNT} daily MRR points (synthetic)`],
  ["Tokenizer", "`js-tiktoken` / `o200k_base`"],
  ["Token rule", ASSUMPTIONS.tokenRule],
  ["GMA lean query", "`points=auto` + `also_chart=true` → summary only (`s.*` terse keys)"],
  ["GMA full query", "`points=50` — LTTB series in `pts`"],
  ["Error+fix retry", `${ASSUMPTIONS.errorRetryRate * 100}% of flows; fail+fix steps weighted in totals`],
  ["Warm session", "Agent has **no memory** of prior script; re-lists / re-attaches data"],
  ["GMA ingestion", "**n8n/cron `track`** — 0 tokens inside question flow"],
  ["Best-case Python", "Single code-gen turn only; data path stated, not discovered"],
  ["Cost model", `${ASSUMPTIONS.costModel.label}: $${ASSUMPTIONS.costModel.inputPerMillion}/1M in, $${ASSUMPTIONS.costModel.outputPerMillion}/1M out`],
];

const e2eTable = measured
  .map(
    (m) =>
      `| ${m.flow.label} | ${formatNum(m.inTokens)} | ${formatNum(m.outTokens)} | **${formatNum(m.total)}** | ${m.turns} | ${m.toolCalls} |`,
  )
  .join("\n");

const costPer1k = (inT: number, outT: number) =>
  costUsd(inT * 1000, outT * 1000);

const breakdownMd = measured.map(breakdownSection).join("\n\n");

const costRows = [
  ["Python file E2E cold", fileCold, fileCold.total],
  ["Python file E2E warm", fileWarm, fileWarm.total],
  ["GMA lean", gmaLean, gmaLean.total],
  ["GMA full pts=50", gmaFull, gmaFull.total],
  ["Best-case file Python", bestCase, bestCase.total],
]
  .map(([label, m, total]) => {
    const row = m as { inTokens: number; outTokens: number };
    const usd = costPer1k(row.inTokens, row.outTokens);
    return `| ${label} | ${formatNum(total as number)} | $${usd.toFixed(2)} |`;
  })
  .join("\n");

const insight = generateInsight("stripe.mrr", series, "90d");
const summary = computeSummary(series);

const defTable = `| Bundle | Tools | Schema tokens (tools/list JSON) |
|--------|-------|----------------------------------|
| GraphMyAnything MCP | 4 | **${formatNum(gmaDefTokens)}** |
| Python agent harness (representative) | 6 | **${formatNum(pyDefTokens)}** |

| Flow | Excl. defs | + defs × turns | + defs once (cached) |
|------|------------|----------------|----------------------|
| Python file E2E cold | ${formatNum(fileCold.total)} | **${formatNum(fileColdDefs.perTurn)}** | ${formatNum(fileColdDefs.onceCached)} |
| GMA lean | ${formatNum(gmaLean.total)} | **${formatNum(gmaLeanDefs.perTurn)}** | ${formatNum(gmaLeanDefs.onceCached)} |

Prompt caching often discounts repeated tool schemas after turn 1; we show both **worst-case (× turns)** and **cached-once**.`;

const oneLiner = `End-to-end (excl. tool defs), GMA lean is **${formatNum(gmaLean.total)}** tokens vs **${formatNum(fileCold.total)}** file-Python (**${pctDeltaLabel(fileCold.total, gmaLean.total)}**), with **${formatNum(gmaDefTokens)}**-token MCP schemas vs **${formatNum(pyDefTokens)}**-token file/shell harness schemas.`;

const md = `# Token benchmark (end-to-end)

## Headline (defensible)

> ${oneLiner}

**Best-case file Python (~${formatNum(bestCase.total)} tokens) is ~${Math.round(fileCold.total / bestCase.total)}× too low.** Measured **end-to-end** file flow (search → locate → schema → script → pip → run → **shared final answer**): **${formatNum(fileCold.total)}** tokens (${fileCold.turns} turns, ${fileCold.toolCalls} tool calls).

**GMA lean (\`points=auto\`, \`also_chart\`):** **${formatNum(gmaLean.inTokens)}** in · **${formatNum(gmaLean.outTokens)}** out · **${formatNum(gmaLean.total)}** total — ${pctDeltaLabel(fileCold.total, gmaLean.total)} than file E2E cold (${formatNum(fileCold.total)}). **GMA full (\`points=50\`):** **${formatNum(gmaFull.total)}** (${formatNum(gmaFull.inTokens)} in · ${formatNum(gmaFull.outTokens)} out).

**vs inline JSON E2E:** lean ${vsPhrase(inlineCold.total, gmaLean.total)}.

**${SESSIONS} warm sessions:** file E2E ${formatNum(fileWarm.total * SESSIONS)} · GMA lean ${formatNum(gmaLean.total * SESSIONS)} · inline ${formatNum(inlineWarm.total * SESSIONS)}.

**Cost @ 1,000 Q (${ASSUMPTIONS.costModel.label}, in $${ASSUMPTIONS.costModel.inputPerMillion}/M · out $${ASSUMPTIONS.costModel.outputPerMillion}/M):** file E2E cold **$${costPer1k(fileCold.inTokens, fileCold.outTokens).toFixed(2)}** · GMA lean **$${costPer1k(gmaLean.inTokens, gmaLean.outTokens).toFixed(2)}** · GMA full **$${costPer1k(gmaFull.inTokens, gmaFull.outTokens).toFixed(2)}**.

## Assumptions (transparent)

| Item | Value |
|------|--------|
${assumptionsRows.map(([k, v]) => `| ${k} | ${v} |`).join("\n")}

### E2E step model (Python file cold)

${fileCold.flow.steps
  .map(
    (s) =>
      `- **${s.name}** — ${s.description} (${s.toolCalls} tool calls${s.weight != null && s.weight < 1 ? `, weight ${s.weight}` : ""})`,
  )
  .join("\n")}

## End-to-end token totals

| Flow | Input (context) | Output (model) | **Total** | Turns | Tool calls |
|------|-----------------|----------------|-----------|-------|------------|
${e2eTable}
| Best-case file Python (1 turn) | ${formatNum(bestCase.inTokens)} | ${formatNum(bestCase.outTokens)} | **${formatNum(bestCase.total)}** | ${bestCase.turns} | ${bestCase.toolCalls} |

## Per-step breakdown (auditable)

${breakdownMd}

## Tool definition overhead

${defTable}

## $ cost per 1,000 identical questions

| Flow | Tokens / question | Est. API cost |
|------|-------------------|---------------|
${costRows}

Pricing: [${ASSUMPTIONS.costModel.label}](${ASSUMPTIONS.costModel.source}).

## ${SESSIONS}-session warm cumulative

| Flow | Per session | × ${SESSIONS} |
|------|-------------|-------------|
| Python file E2E warm | ${formatNum(fileWarm.total)} | **${formatNum(fileWarm.total * SESSIONS)}** |
| Python inline E2E warm | ${formatNum(inlineWarm.total)} | **${formatNum(inlineWarm.total * SESSIONS)}** |
| GMA lean | ${formatNum(gmaLean.total)} | **${formatNum(gmaLean.total * SESSIONS)}** |

## Answer quality (same prompt)

| Flow | Trend | % change | Anomalies w/o extra chat |
|------|-------|----------|---------------------------|
| Python E2E | Printed in stdout | Printed | No (+1 turn typical) |
| GMA query + chart | \`summary.trend=${summary.trend}\` | \`summary.pct_change=${summary.pct_change}\` | Use \`insight\` tool |
| GMA + insight | Yes | Yes | Yes (${insight.anomalies.length} in synthetic run) |

## Caveats

- Modeled flows, not live agent traces; token counts are **reproducible** from step text in \`e2e-flows.ts\`.
- **Best-case** row is a deliberate lower bound; citing it without E2E is misleading.
- File E2E assumes the agent does not paste the whole JSON into chat when told to read from disk.
- GMA \`chart\` returns a path, not image bytes (same as Python PNG on disk).
- Other model tokenizers differ slightly; dollar lines scale linearly with token split.
- **Shared** \`SHARED_USER_CONTEXT\` on turn 1 and \`SHARED_FINAL_ANSWER\` on the last step for every flow (\`e2e-assumptions.ts\`).
- Python harness defs are a **representative** Cursor-style 6-tool bundle, not a live session export.

## Reproduce

\`\`\`bash
cd benchmarks/token-benchmark
npm install
npm run run
\`\`\`

From repo root: \`npm run benchmark:tokens\`

![Token benchmark](./token-benchmark.svg)
`;

const outDir = __dirname;
const svg = renderChart(primaryBarsSocial, secondaryBarsSocial);
fs.writeFileSync(path.join(outDir, "token-benchmark.svg"), svg, "utf8");
fs.writeFileSync(path.join(outDir, "results.md"), md, "utf8");
await sharp(Buffer.from(svg)).resize(2400).png().toFile(path.join(outDir, "token-benchmark.png"));

console.log("Wrote results.md, token-benchmark.svg, token-benchmark.png");
console.log(
  `E2E cold file=${fileCold.total} gmaLean=${gmaLean.total} (${pctDeltaLabel(fileCold.total, gmaLean.total)}) gmaFull=${gmaFull.total}`,
);
console.log(`Lean query payload: ${payloads.leanQuery.length} chars, full: ${payloads.fullQuery.length} chars`);
console.log(`Best case=${bestCase.total}`);