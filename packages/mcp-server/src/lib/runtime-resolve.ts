import fs from "node:fs";
import type { GmaMode } from "../config.js";
import {
  DEFAULT_CREDENTIALS_PATH,
  LEGACY_CONFIG_PATH,
  readConfig,
  resolveConfigPath,
} from "../config.js";
import { HostedClient } from "../hosted/client.js";
import { resolveApiKey, resolveMode } from "../mode.js";
import type { ToolRuntime } from "../tools/runtime.js";

function configMtimeFingerprint(): string {
  const parts: string[] = [];
  for (const p of [
    resolveConfigPath(),
    DEFAULT_CREDENTIALS_PATH,
    LEGACY_CONFIG_PATH,
  ]) {
    try {
      parts.push(String(fs.statSync(p).mtimeMs));
    } catch {
      parts.push("0");
    }
  }
  return parts.join(":");
}

let lastSnapshot = "";

export function resetRuntimeResolveCacheForTests(): void {
  lastSnapshot = "";
}

function snapshot(): string {
  const forced = process.env.GRAPHMYANYTHING_MODE?.trim().toLowerCase() ?? "";
  const config = readConfig();
  const mode = resolveMode(config);
  const apiKey = resolveApiKey(config) ?? "";
  return `${forced}|${configMtimeFingerprint()}|${mode}|${apiKey.length}:${apiKey.slice(-8)}`;
}

function applyHostedClient(
  rt: ToolRuntime,
  mode: GmaMode,
  apiKey: string | undefined,
): void {
  rt.mode = mode;
  if (mode === "hosted" && apiKey) {
    if (!rt.client) {
      rt.client = new HostedClient({ apiKey });
    } else if (rt.client.getApiKey() !== apiKey) {
      rt.client.setApiKey(apiKey);
    }
  } else {
    rt.client = undefined;
  }
}

/** Re-read mode and credentials when config mtimes, keychain, or env changes. */
export function refreshToolRuntime(rt: ToolRuntime, force = false): boolean {
  const snap = snapshot();
  if (!force && snap === lastSnapshot) {
    return false;
  }
  lastSnapshot = snap;
  const config = readConfig();
  const mode = resolveMode(config);
  const apiKey = resolveApiKey(config);
  applyHostedClient(rt, mode, apiKey);
  return true;
}

export function peekResolvedMode(): GmaMode {
  return resolveMode(readConfig());
}