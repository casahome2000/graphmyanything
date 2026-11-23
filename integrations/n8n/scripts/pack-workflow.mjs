#!/usr/bin/env node
/**
 * Inline stripe-mrr-sync-core into track-stripe-mrr-daily.json Code node (no require/credentials).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const corePath = path.join(root, "stripe-mrr-sync-core.mjs");
const tailPath = path.join(root, "n8n-compute-tail.js");
const workflowPath = path.join(root, "track-stripe-mrr-daily.json");

const coreSrc = fs
  .readFileSync(corePath, "utf8")
  .replace(/^\/\*\*[\s\S]*?\*\/\n/, "")
  .replace(/^\/\/.*\n/gm, (m) => (m.includes("eslint") ? m : ""))
  .replace(/\bexport function /g, "function ")
  .replace(/\bexport /g, "");

const tailSrc = fs.readFileSync(tailPath, "utf8");
const jsCode = `${coreSrc.trim()}\n\n${tailSrc.trim()}\n`;

const workflow = JSON.parse(fs.readFileSync(workflowPath, "utf8"));
const compute = workflow.nodes.find((n) => n.id === "compute-mrr");
if (!compute) {
  throw new Error("Missing compute-mrr node in workflow JSON");
}
compute.parameters.jsCode = jsCode;
fs.writeFileSync(workflowPath, `${JSON.stringify(workflow, null, 2)}\n`, "utf8");
console.log(`Packed ${jsCode.length} chars into Compute MRR jsCode`);