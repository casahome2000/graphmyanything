#!/usr/bin/env node
/**
 * Rewrites package.json for npm pack/publish: bundled @graphmyanything/core uses
 * a semver range instead of file:../core. Restored by postpack-manifest.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pkgPath = path.join(pkgRoot, "package.json");
const backupPath = path.join(pkgRoot, ".package.json.prepack-backup");
const corePath = path.join(pkgRoot, "../core/package.json");

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const coreVer = JSON.parse(fs.readFileSync(corePath, "utf8")).version;

fs.writeFileSync(backupPath, `${JSON.stringify(pkg, null, 2)}\n`);

const next = structuredClone(pkg);
if (next.devDependencies?.["@graphmyanything/core"]) {
  delete next.devDependencies["@graphmyanything/core"];
}
next.dependencies = { ...next.dependencies };
delete next.dependencies["@graphmyanything/core"];
next.dependencies["@graphmyanything/core"] = coreVer;

fs.writeFileSync(pkgPath, `${JSON.stringify(next, null, 2)}\n`);
console.log(
  `prepack-manifest: @graphmyanything/core pinned to ${coreVer} for pack`,
);