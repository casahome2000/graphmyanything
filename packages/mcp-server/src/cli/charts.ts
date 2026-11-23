import fs from "node:fs";
import path from "node:path";
import { resolveChartsDir } from "../paths.js";

export function runCharts(): number {
  const dir = resolveChartsDir();
  if (!fs.existsSync(dir)) {
    console.log(`No charts directory yet at ${dir}`);
    return 0;
  }
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".svg"))
    .map((f) => ({ name: f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, 20);

  if (files.length === 0) {
    console.log(`Charts directory: ${dir} (empty)`);
    return 0;
  }

  console.log(`Recent charts in ${dir}:`);
  for (const f of files) {
    console.log(`  ${path.join(dir, f.name)}`);
  }
  return 0;
}