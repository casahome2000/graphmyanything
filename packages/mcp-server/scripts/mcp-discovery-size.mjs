#!/usr/bin/env node
/**
 * Measure tools/list, resources/list, and initialize result sizes (chars÷4) over stdio.
 */
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const serverJs = path.join(root, "dist/index.js");

function estimateTokens(obj) {
  return Math.ceil(JSON.stringify(obj).length / 4);
}

const child = spawn(process.execPath, ["--disable-warning=ExperimentalWarning", serverJs], {
  env: {
    ...process.env,
    GRAPHMYANYTHING_DB_PATH: `/tmp/gma-discovery-${Date.now()}.db`,
  },
  stdio: ["pipe", "pipe", "pipe"],
});

let nextId = 1;
function send(msg) {
  child.stdin.write(JSON.stringify(msg) + "\n");
}

function readLine() {
  return new Promise((resolve, reject) => {
    const rl = createInterface({ input: child.stdout });
    rl.once("line", (line) => {
      rl.close();
      try {
        resolve(JSON.parse(line));
      } catch (e) {
        reject(e);
      }
    });
  });
}

async function rpc(method, params = {}) {
  const id = nextId++;
  send({ jsonrpc: "2.0", id, method, params });
  const res = await readLine();
  if (res.error) throw new Error(res.error.message);
  return res.result;
}

try {
  const init = await rpc("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "discovery-size", version: "0" },
  });
  send({ jsonrpc: "2.0", method: "notifications/initialized" });

  const tools = await rpc("tools/list", {});
  const resources = await rpc("resources/list", {});

  const report = {
    initialize_tokens: estimateTokens(init),
    initialize_has_instructions: Boolean(init.instructions),
    instructions_tokens: init.instructions
      ? Math.ceil(String(init.instructions).length / 4)
      : 0,
    tools_list_tokens: estimateTokens(tools),
    resources_list_tokens: estimateTokens(resources),
    tool_names: (tools.tools ?? []).map((t) => t.name).sort(),
    resource_names: (resources.resources ?? []).map((r) => r.name).sort(),
  };

  console.log(JSON.stringify(report, null, 2));
  child.stdin.end();
  child.kill();
} catch (e) {
  console.error(e);
  child.kill();
  process.exit(1);
}