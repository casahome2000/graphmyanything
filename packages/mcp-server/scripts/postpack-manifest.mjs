#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pkgPath = path.join(pkgRoot, "package.json");
const backupPath = path.join(pkgRoot, ".package.json.prepack-backup");

if (!fs.existsSync(backupPath)) {
  console.warn("postpack-manifest: no backup found, skipping restore");
  process.exit(0);
}

fs.copyFileSync(backupPath, pkgPath);
fs.unlinkSync(backupPath);
console.log("postpack-manifest: restored package.json");