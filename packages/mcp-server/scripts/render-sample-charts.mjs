#!/usr/bin/env node
/**
 * Dev-only: render reference chart SVGs and PNGs for docs / PR previews.
 * Usage: node scripts/render-sample-charts.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.join(__dirname, "..");
const docsDir = path.join(pkgRoot, "docs");

// Load compiled chart renderer (run `npm run build` first).
const { renderSvgChart } = await import(
  path.join(pkgRoot, "dist/lib/svg-chart.js")
);

/** Approximate Plano, TX–style growth: boom years, then slower / flat tail (1995–2024). */
function populationSeries() {
  const populations = [
    128_400, 131_200, 135_800, 141_500, 149_200, 158_900, 169_500, 182_100,
    196_800, 207_500, 222_300, 236_900, 250_100, 259_800, 267_400, 275_900,
    281_200, 285_600, 288_900, 291_100, 292_400, 293_800, 294_500, 295_200,
    296_100, 296_400, 296_200, 295_900, 296_800, 297_100,
  ];
  const start = Date.UTC(1995, 0, 1) / 1000;
  const year = 365 * 86_400;
  return populations.map((value, i) => ({
    ts: start + i * year,
    value,
  }));
}

function weightSeries() {
  const base = Date.UTC(2025, 0, 6) / 1000;
  return [
    { ts: base, value: 182.4 },
    { ts: base + 7 * 86_400, value: 181.1 },
    { ts: base + 14 * 86_400, value: 180.6 },
    { ts: base + 21 * 86_400, value: 179.8 },
  ];
}

const specs = [
  {
    name: "sample-population-30y",
    metric: "city.plano.population",
    points: populationSeries(),
    type: "line",
  },
  {
    name: "sample-weight-4pt",
    metric: "health.weight.lb",
    points: weightSeries(),
    type: "line",
  },
];

fs.mkdirSync(docsDir, { recursive: true });
const written = [];

for (const spec of specs) {
  for (const theme of ["dark", "light"]) {
    const svg = renderSvgChart(spec.metric, spec.points, spec.type, theme);
    const svgPath = path.join(docsDir, `${spec.name}-${theme}.svg`);
    fs.writeFileSync(svgPath, svg, "utf8");
    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 640 } });
    const png = resvg.render();
    const pngPath = path.join(docsDir, `${spec.name}-${theme}.png`);
    fs.writeFileSync(pngPath, png.asPng());
    written.push({ svgPath, pngPath });
  }
}

console.log(JSON.stringify({ ok: true, files: written }, null, 2));