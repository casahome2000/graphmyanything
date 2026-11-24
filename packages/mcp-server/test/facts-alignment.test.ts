import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { measureCanonicalFacts } from "../../../benchmarks/token-benchmark/canonical-facts.js";

const repoRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const factsPath = path.join(repoRoot, "facts/facts.json");

describe("facts/facts.json vs live measurement", () => {
  it("benchmark and tools.listTokens match canonical measurement", () => {
    const facts = JSON.parse(fs.readFileSync(factsPath, "utf8"));
    const measured = measureCanonicalFacts();
    expect(facts.tools.listTokens).toBe(measured.listTokens);
    expect(facts.benchmark).toEqual(measured.benchmark);
  });
});