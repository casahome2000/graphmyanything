import fs from "node:fs";
import path from "node:path";
import { resolveChartsDir } from "../paths.js";

export * from "../vendor/core/svg-chart.js";

export function writeChartFile(
  metric: string,
  svg: string,
  outDir?: string,
): string {
  const dir = outDir ?? resolveChartsDir();
  fs.mkdirSync(dir, { recursive: true });
  const safe = metric.replace(/[^a-zA-Z0-9._-]/g, "_");
  const file = path.join(dir, `${safe}-${Date.now()}.svg`);
  fs.writeFileSync(file, svg, "utf8");
  return file;
}