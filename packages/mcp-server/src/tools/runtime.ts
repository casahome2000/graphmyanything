import type { GmaDatabase } from "../db.js";
import { HostedClient } from "../hosted/client.js";
import type { GmaMode } from "../config.js";
import { withTokensEstimate } from "../lib/tokens.js";
import {
  handleChart,
  handleForget,
  handleInsight,
  handleQuery,
  handleTrack,
} from "./handlers.js";

export type ToolRuntime = {
  mode: GmaMode;
  db: GmaDatabase;
  client?: HostedClient;
};

export async function runTrack(
  rt: ToolRuntime,
  args: Parameters<typeof handleTrack>[1],
): Promise<ReturnType<typeof handleTrack>> {
  if (rt.mode === "hosted" && rt.client) {
    const remote = await rt.client.track(args);
    handleTrack(rt.db, args);
    return withTokensEstimate(remote);
  }
  return handleTrack(rt.db, args);
}

export async function runForget(
  rt: ToolRuntime,
  args: Parameters<typeof handleForget>[1],
): Promise<ReturnType<typeof handleForget>> {
  if (rt.mode === "hosted" && rt.client) {
    const remote = await rt.client.forget(args);
    handleForget(rt.db, args);
    return withTokensEstimate(remote);
  }
  return handleForget(rt.db, args);
}

export async function runQuery(
  rt: ToolRuntime,
  args: Parameters<typeof handleQuery>[1],
): Promise<Record<string, unknown>> {
  if (rt.mode === "hosted" && rt.client) {
    return rt.client.query(args);
  }
  return handleQuery(rt.db, args);
}

export async function runInsight(
  rt: ToolRuntime,
  args: Parameters<typeof handleInsight>[1],
): Promise<ReturnType<typeof handleInsight>> {
  if (rt.mode === "hosted" && rt.client) {
    return (await rt.client.insight(args)) as ReturnType<typeof handleInsight>;
  }
  return handleInsight(rt.db, args);
}

export async function runChart(
  rt: ToolRuntime,
  args: Parameters<typeof handleChart>[1] & { share?: boolean },
): Promise<Record<string, unknown>> {
  if (rt.mode === "hosted" && rt.client) {
    const remote = (await rt.client.chart(args)) as Record<string, unknown>;
    const local = handleChart(rt.db, args);
    const share = args.share !== false;
    if (!share) {
      return withTokensEstimate({
        ...remote,
        url: null,
        path: local.path,
      });
    }
    return withTokensEstimate({
      ...remote,
      path: local.path,
    });
  }
  return handleChart(rt.db, args);
}