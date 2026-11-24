/** Numbers written to facts/facts.json — same logic as run.ts E2E measurement. */

import { getEncoding } from "js-tiktoken";
import { buildAllE2EFlows } from "./e2e-flows.js";
import {
  buildGmaPayloads,
  PUBLISHED_BENCH_SERIES_NOW,
} from "./gma-payloads.js";
import {
  gmaToolDefsJson,
  PYTHON_HARNESS_TOOLS_JSON,
} from "./tool-definitions.js";
import {
  ASSUMPTIONS,
  SHARED_FINAL_ANSWER,
  SHARED_USER_CONTEXT,
} from "./e2e-assumptions.js";
import type { E2EFlow } from "./e2e-assumptions.js";

const enc = getEncoding("o200k_base");

function countTokens(text: string): number {
  return enc.encode(text).length;
}

function measureFlow(flow: E2EFlow) {
  const steps = flow.steps.map((step) => {
    const w = step.weight ?? 1;
    const inTokens = Math.round(countTokens(step.contextInput) * w);
    const outTokens = Math.round(countTokens(step.modelOutput) * w);
    return { total: inTokens + outTokens, inTokens, outTokens };
  });
  return {
    total: steps.reduce((a, s) => a + s.total, 0),
    inTokens: steps.reduce((a, s) => a + s.inTokens, 0),
    outTokens: steps.reduce((a, s) => a + s.outTokens, 0),
  };
}

function pctFewer(base: number, value: number): number {
  return Math.round(((base - value) / base) * 1000) / 10;
}

function costPer1k(inTokens: number, outTokens: number): number {
  const inM = (inTokens * 1000) / 1_000_000;
  const outM = (outTokens * 1000) / 1_000_000;
  return (
    inM * ASSUMPTIONS.costModel.inputPerMillion +
    outM * ASSUMPTIONS.costModel.outputPerMillion
  );
}

function roundUsd(n: number): number {
  return Math.round(n * 100) / 100;
}

function measureBestCasePython() {
  const pointCount = ASSUMPTIONS.pointCount;
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
  const out = output.slice(
    0,
    Math.floor(output.length * ASSUMPTIONS.minimalOutputRetryFactor),
  );
  return {
    inTokens: countTokens(input),
    outTokens: countTokens(out),
    total: countTokens(input) + countTokens(out),
  };
}

export type CanonicalBenchmark = {
  tokenizer: string;
  costModel: {
    label: string;
    inputPerMillionUsd: number;
    outputPerMillionUsd: number;
  };
  fileE2ETokens: number;
  leanTokens: number;
  leanReductionPct: number;
  embedTokens: number;
  embedReductionPct: number;
  bestCaseScriptTokens: number;
  fullPts50Tokens: number;
  inlineE2ETokens: number;
  pythonHarnessListTokens: number;
  warm30: {
    gmaTokens: number;
    fileTokens: number;
    reductionPct: number;
  };
  costPer1kQuestionsUsd: {
    lean: number;
    embed: number;
    full: number;
    file: number;
    bestCaseScript: number;
  };
};

export function measureCanonicalFacts(): {
  listTokens: number;
  benchmark: CanonicalBenchmark;
} {
  const series = Array.from({ length: ASSUMPTIONS.pointCount }, (_, i) => {
    const now = PUBLISHED_BENCH_SERIES_NOW;
    return {
      ts: now - (ASSUMPTIONS.pointCount - 1 - i) * 86400,
      value: Math.round(65_000 + i * 95 + Math.sin(i / 12) * 1_200),
    };
  });
  const dataJson = JSON.stringify(series);
  const payloads = buildGmaPayloads(series);
  const flows = buildAllE2EFlows(dataJson, payloads);
  const byId = (id: string) => flows.find((f) => f.id === id)!;
  const measured = flows.map((f) => ({ id: f.id, ...measureFlow(f) }));
  const get = (id: string) => measured.find((m) => m.id === id)!;

  const fileCold = get("python_file_e2e_cold");
  const fileWarm = get("python_file_e2e_warm");
  const gmaLean = get("gma_lean");
  const gmaLeanEmbed = get("gma_lean_embed");
  const gmaFull = get("gma_full");
  const inlineCold = get("python_inline_e2e_cold");
  const bestCase = measureBestCasePython();

  const cumulative30 = {
    gmaLean: gmaLean.total * ASSUMPTIONS.sessions,
    fileWarm: fileWarm.total * ASSUMPTIONS.sessions,
  };

  const gmaLeanFlow = flows.find((f) => f.id === "gma_lean")!;
  const gmaLeanMeasured = measureFlow(gmaLeanFlow);
  const gmaFullFlow = flows.find((f) => f.id === "gma_full")!;
  const gmaFullMeasured = measureFlow(gmaFullFlow);
  const gmaEmbedFlow = flows.find((f) => f.id === "gma_lean_embed")!;
  const gmaEmbedMeasured = measureFlow(gmaEmbedFlow);
  const fileColdFlow = flows.find((f) => f.id === "python_file_e2e_cold")!;
  const fileColdMeasured = measureFlow(fileColdFlow);

  return {
    listTokens: countTokens(gmaToolDefsJson()),
    benchmark: {
      tokenizer: "o200k",
      costModel: {
        label: ASSUMPTIONS.costModel.label,
        inputPerMillionUsd: ASSUMPTIONS.costModel.inputPerMillion,
        outputPerMillionUsd: ASSUMPTIONS.costModel.outputPerMillion,
      },
      fileE2ETokens: fileCold.total,
      leanTokens: gmaLean.total,
      leanReductionPct: pctFewer(fileCold.total, gmaLean.total),
      embedTokens: gmaLeanEmbed.total,
      embedReductionPct: pctFewer(fileCold.total, gmaLeanEmbed.total),
      bestCaseScriptTokens: bestCase.total,
      fullPts50Tokens: gmaFull.total,
      inlineE2ETokens: inlineCold.total,
      pythonHarnessListTokens: countTokens(PYTHON_HARNESS_TOOLS_JSON),
      warm30: {
        gmaTokens: cumulative30.gmaLean,
        fileTokens: cumulative30.fileWarm,
        reductionPct: pctFewer(cumulative30.fileWarm, cumulative30.gmaLean),
      },
      costPer1kQuestionsUsd: {
        lean: roundUsd(costPer1k(gmaLeanMeasured.inTokens, gmaLeanMeasured.outTokens)),
        embed: roundUsd(costPer1k(gmaEmbedMeasured.inTokens, gmaEmbedMeasured.outTokens)),
        full: roundUsd(costPer1k(gmaFullMeasured.inTokens, gmaFullMeasured.outTokens)),
        file: roundUsd(costPer1k(fileColdMeasured.inTokens, fileColdMeasured.outTokens)),
        bestCaseScript: roundUsd(costPer1k(bestCase.inTokens, bestCase.outTokens)),
      },
    },
  };
}