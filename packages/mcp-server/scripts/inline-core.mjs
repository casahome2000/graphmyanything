#!/usr/bin/env node
/**
 * Copy built @graphmyanything/core into src/vendor/core so published
 * graphmyanything-mcp has no registry dependency on core (bun/pnpm safe).
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const pkgRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const coreRoot = path.join(pkgRoot, "../core");
const vendorDir = path.join(pkgRoot, "src/vendor/core");
const coreDist = path.join(coreRoot, "dist");

const build = spawnSync("npm", ["run", "build"], {
  cwd: coreRoot,
  stdio: "inherit",
});
if (build.status !== 0) process.exit(build.status ?? 1);

if (!fs.existsSync(coreDist)) {
  console.error("inline-core: missing ../core/dist");
  process.exit(1);
}

fs.rmSync(vendorDir, { recursive: true, force: true });
fs.mkdirSync(vendorDir, { recursive: true });

for (const name of fs.readdirSync(coreDist)) {
  if (name.endsWith(".js") || name.endsWith(".d.ts") || name.endsWith(".js.map")) {
    fs.copyFileSync(path.join(coreDist, name), path.join(vendorDir, name));
  }
}

console.log(`inline-core: copied ${fs.readdirSync(vendorDir).length} files to src/vendor/core`);