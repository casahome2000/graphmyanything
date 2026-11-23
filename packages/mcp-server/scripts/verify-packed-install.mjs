#!/usr/bin/env node
/**
 * Optional local verifier: pack tarball and smoke-test install (npm/pnpm/bun).
 * Usage: node scripts/verify-packed-install.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", ...opts });
  return { status: r.status ?? 1, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

function log(section, text) {
  console.log(`\n=== ${section} ===\n${text.trim()}\n`);
}

const pack = run("npm", ["pack", "--pack-destination", pkgRoot], { cwd: pkgRoot });
if (pack.status !== 0) {
  console.error(pack.stderr);
  process.exit(1);
}
const tgz = pack.stdout.trim().split("\n").pop();
const tgzPath = path.join(pkgRoot, tgz);
const packedJson = run("tar", ["-xOf", tgzPath, "package/package.json"]);
const pkg = JSON.parse(packedJson.stdout);
const depKeys = Object.keys(pkg.dependencies ?? {});
const bundled = pkg.bundleDependencies ?? pkg.bundledDependencies ?? [];
log(
  "npm pack",
  `tarball: ${tgz}\ndependencies: ${JSON.stringify(depKeys)}\nbundleDependencies: ${JSON.stringify(bundled)}\nhas @graphmyanything/core: ${JSON.stringify(pkg).includes("@graphmyanything/core")}`,
);

const managers = [
  { name: "npm", install: (dir) => run("npm", ["install", tgzPath, "--ignore-scripts"], { cwd: dir }) },
  { name: "pnpm", install: (dir) => run("pnpm", ["add", tgzPath, "--ignore-scripts"], { cwd: dir }) },
  { name: "bun", install: (dir) => run("bun", ["add", tgzPath], { cwd: dir }) },
];

for (const m of managers) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `gma-${m.name}-`));
  if (m.name === "pnpm") {
    fs.writeFileSync(path.join(dir, "package.json"), '{"private":true}\n');
  } else {
    const init = run("npm", ["init", "-y"], { cwd: dir });
    if (init.status !== 0) {
      log(m.name, `skip (init failed): ${init.stderr}`);
      continue;
    }
  }
  const ins = m.install(dir);
  if (ins.status !== 0) {
    log(m.name, `INSTALL FAILED\n${ins.stderr}`);
    process.exit(1);
  }
  const helpCmd =
    m.name === "bun"
      ? run("bun", ["x", "graphmyanything-mcp", "--help"], { cwd: dir })
      : run("npx", ["graphmyanything-mcp", "--help"], { cwd: dir });
  const syncHelp =
    m.name === "bun"
      ? run("bun", ["x", "graphmyanything-mcp", "sync", "--help"], { cwd: dir })
      : run("npx", ["graphmyanything-mcp", "sync", "--help"], { cwd: dir });
  log(
    m.name,
    `install: ok\n--help exit ${helpCmd.status}\n${(helpCmd.stdout || helpCmd.stderr).slice(0, 200)}...\nsync --help exit ${syncHelp.status}`,
  );
}

console.log("verify-packed-install: OK");