import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export type ConnectorState = {
  version: 1;
  updatedAt: string;
  lastBackfillUtcDay?: number;
  lastSyncUtcDay?: number;
  subscriptionCount?: number;
  currencies?: string[];
  lastWrite?: { written: number; replaced: number };
};

const DEFAULT_STATE = path.join(
  os.homedir(),
  ".graphmyanything",
  "stripe-connector.json",
);

export function resolveStatePath(): string {
  return process.env.GRAPHMYANYTHING_STRIPE_STATE_PATH ?? DEFAULT_STATE;
}

export function loadState(): ConnectorState | null {
  const p = resolveStatePath();
  if (!fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw) as ConnectorState;
}

export function saveState(patch: Partial<ConnectorState>): ConnectorState {
  const p = resolveStatePath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const prev = loadState();
  const next: ConnectorState = {
    version: 1,
    updatedAt: new Date().toISOString(),
    ...prev,
    ...patch,
  };
  fs.writeFileSync(p, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}