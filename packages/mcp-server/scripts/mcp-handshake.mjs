#!/usr/bin/env node
/**
 * Minimal stdio MCP handshake: initialize, tools/list, track, query.
 */
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

const bin = process.argv[2];
if (!bin) {
  console.error("Usage: node scripts/mcp-handshake.mjs <path-to-graphmyanything-mcp>");
  process.exit(1);
}

const stderrChunks = [];
const child = spawn(process.execPath, ["--disable-warning=ExperimentalWarning", bin], {
  env: { ...process.env, GRAPHMYANYTHING_DB_PATH: `/tmp/gma-handshake-${Date.now()}.db` },
  stdio: ["pipe", "pipe", "pipe"],
});
child.stderr.on("data", (d) => stderrChunks.push(d));

let nextId = 1;
function send(msg) {
  child.stdin.write(JSON.stringify(msg) + "\n");
}

function readLine() {
  return new Promise((resolve) => {
    const rl = createInterface({ input: child.stdout });
    rl.once("line", (line) => {
      rl.close();
      resolve(JSON.parse(line));
    });
  });
}

async function rpc(method, params = {}) {
  const id = nextId++;
  send({ jsonrpc: "2.0", id, method, params });
  const res = await readLine();
  if (res.id !== id) throw new Error(`Mismatched id: ${JSON.stringify(res)}`);
  if (res.error) throw new Error(res.error.message);
  return res.result;
}

try {
  await rpc("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "handshake-test", version: "0" },
  });
  send({ jsonrpc: "2.0", method: "notifications/initialized" });

  const tools = await rpc("tools/list", {});
  const names = (tools.tools ?? []).map((t) => t.name).sort();
  if (names.join(",") !== "chart,forget,insight,query,track") {
    throw new Error(`Unexpected tools: ${names.join(", ")}`);
  }

  await rpc("tools/call", {
    name: "track",
    arguments: { metric: "handshake.test", value: 42 },
  });
  const q = await rpc("tools/call", {
    name: "query",
    arguments: { metric: "handshake.test", points: 0 },
  });
  const text = q.content?.[0]?.text ?? "";
  if (!text.includes("handshake.test")) {
    throw new Error(`Query missing metric in response: ${text.slice(0, 200)}`);
  }

  child.stdin.end();
  const err = Buffer.concat(stderrChunks).toString("utf8");
  if (/ExperimentalWarning|SQLite is an experimental/i.test(err)) {
    throw new Error(`SQLite warning on stderr: ${err}`);
  }
  console.log(JSON.stringify({ ok: true, tools: names, queryPreview: text.slice(0, 120) }, null, 2));
  child.kill();
  process.exit(0);
} catch (e) {
  child.kill();
  console.error(e);
  console.error("stderr:", Buffer.concat(stderrChunks).toString());
  process.exit(1);
}