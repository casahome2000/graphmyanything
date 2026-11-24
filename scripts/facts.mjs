#!/usr/bin/env node
/**
 * Canonical facts: fill Markdown markers and verify drift.
 * Usage:
 *   node scripts/facts.mjs --write
 *   node scripts/facts.mjs --check
 *   node scripts/facts.mjs render <in> <out>
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const FACTS_PATH = path.join(ROOT, "facts", "facts.json");

const MARKER_FILES = [
  "README.md",
  "packages/mcp-server/README.md",
  "packages/core/README.md",
  "packages/stripe-mrr/README.md",
  "integrations/n8n/README.md",
  "docs/quickstart.md",
  "docs/agent-guide.md",
  "docs/hosted-api.md",
  "docs/examples.md",
  "docs/stripe-mrr.md",
];

const MARKER_RE =
  /<!-- fact:([\w.]+)(?:\s+fmt:(\w+))? -->([\s\S]*?)<!-- \/fact -->/g;
const TEMPLATE_RE = /\{\{fact:([\w.]+)(?:\s+fmt:(\w+))?\}\}/g;

function loadFacts() {
  return JSON.parse(fs.readFileSync(FACTS_PATH, "utf8"));
}

function getPath(obj, dotPath) {
  return dotPath.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function formatValue(value, fmt) {
  if (value === undefined || value === null) {
    throw new Error(`missing fact value for format ${fmt}`);
  }
  const f = fmt || "raw";
  if (f === "raw") return String(value);
  if (f === "int") return Number(value).toLocaleString("en-US");
  if (f === "intPlain") return String(value);
  if (f === "pct") return String(value);
  if (f === "usd") return `$${Number(value).toFixed(2)}`;
  if (f === "compactK") {
    const n = Number(value);
    if (n >= 1000 && n % 1000 === 0) return `${n / 1000}k`;
    return String(n);
  }
  if (f === "boolAutoRenews") {
    return value ? "auto-renews" : "does not auto-renew";
  }
  throw new Error(`unknown fmt: ${f}`);
}

function renderContent(content, facts) {
  let out = content.replace(MARKER_RE, (_m, key, fmt) => {
    const val = getPath(facts, key);
    return `<!-- fact:${key}${fmt ? ` fmt:${fmt}` : ""} -->${formatValue(val, fmt)}<!-- /fact -->`;
  });
  out = out.replace(TEMPLATE_RE, (_m, key, fmt) => {
    const val = getPath(facts, key);
    return formatValue(val, fmt);
  });
  return out;
}

function checkMarkers(content, facts, relPath) {
  const errors = [];
  let match;
  const re = new RegExp(MARKER_RE.source, "g");
  while ((match = re.exec(content)) !== null) {
    const [, key, fmt, inner] = match;
    const expected = formatValue(getPath(facts, key), fmt);
    const actual = inner.trim();
    if (actual !== expected) {
      errors.push(
        `${relPath}: fact:${key} expected ${JSON.stringify(expected)} got ${JSON.stringify(actual)}`,
      );
    }
  }
  return errors;
}

function writeMarkers() {
  const facts = loadFacts();
  for (const rel of MARKER_FILES) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    const next = renderContent(fs.readFileSync(abs, "utf8"), facts);
    fs.writeFileSync(abs, next, "utf8");
  }
  console.log(`Updated markers in ${MARKER_FILES.length} files from facts/facts.json`);
}

function measureBenchmark() {
  const r = spawnSync(
    "npx",
    ["tsx", "benchmarks/token-benchmark/export-canonical-facts.ts"],
    { cwd: ROOT, encoding: "utf8", env: process.env },
  );
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || "export-canonical-facts failed");
  }
  return JSON.parse(r.stdout);
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function checkRegistryDescriptions(facts) {
  const errors = [];
  const reg = facts.copy.registryDescription;
  if (!reg || reg.length > 100) {
    errors.push(`copy.registryDescription must be ≤100 chars (got ${reg?.length ?? 0})`);
  }
  const server = JSON.parse(
    fs.readFileSync(path.join(ROOT, "packages/mcp-server/server.json"), "utf8"),
  );
  if (server.description !== reg) {
    errors.push("packages/mcp-server/server.json description != copy.registryDescription");
  }
  const pkg = JSON.parse(
    fs.readFileSync(path.join(ROOT, "packages/mcp-server/package.json"), "utf8"),
  );
  if (pkg.description !== reg) {
    errors.push("packages/mcp-server/package.json description != copy.registryDescription");
  }
  return errors;
}

function checkBenchmarkFacts(facts) {
  const errors = [];
  const measured = measureBenchmark();
  if (facts.tools.listTokens !== measured.listTokens) {
    errors.push(
      `tools.listTokens: facts ${facts.tools.listTokens} measured ${measured.listTokens}`,
    );
  }
  if (!deepEqual(facts.benchmark, measured.benchmark)) {
    errors.push(
      `benchmark section drift (run benchmark:tokens or node export-canonical-facts):\n` +
        `facts: ${JSON.stringify(facts.benchmark)}\n` +
        `live: ${JSON.stringify(measured.benchmark)}`,
    );
  }
  return errors;
}

function checkAll() {
  const facts = loadFacts();
  const errors = [];
  errors.push(...checkRegistryDescriptions(facts));
  errors.push(...checkBenchmarkFacts(facts));
  for (const rel of MARKER_FILES) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    errors.push(...checkMarkers(fs.readFileSync(abs, "utf8"), facts, rel));
  }
  if (errors.length) {
    console.error("facts:check failed:\n" + errors.map((e) => `  - ${e}`).join("\n"));
    process.exit(1);
  }
  console.log("facts:check OK");
}

function renderCli(inPath, outPath) {
  const facts = loadFacts();
  const absIn = path.isAbsolute(inPath) ? inPath : path.join(ROOT, inPath);
  const absOut = path.isAbsolute(outPath) ? outPath : path.join(ROOT, outPath);
  fs.writeFileSync(absOut, renderContent(fs.readFileSync(absIn, "utf8"), facts), "utf8");
  console.log(`Wrote ${absOut}`);
}

const args = process.argv.slice(2);
if (args[0] === "--write") writeMarkers();
else if (args[0] === "--check") checkAll();
else if (args[0] === "render" && args[1] && args[2]) renderCli(args[1], args[2]);
else {
  console.error("Usage: node scripts/facts.mjs --write | --check | render <in> <out>");
  process.exit(2);
}