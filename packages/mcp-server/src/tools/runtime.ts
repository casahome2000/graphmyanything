import type { GmaDatabase } from "../db.js";
import { HostedClient } from "../hosted/client.js";
import { callWithCredentialRefresh } from "../hosted/credential-refresh.js";
import type { GmaMode } from "../config.js";
import { mergeHostedChartResponse } from "../lib/chart-response.js";
import { throwChartShareRequiresSignIn } from "../lib/chart-hosted.js";
import { uploadLocalBacklogToHosted } from "../lib/local-backlog-upload.js";
import { refreshToolRuntime } from "../lib/runtime-resolve.js";
import { resolveApiKey } from "../mode.js";
import { withTokensEstimate } from "../lib/tokens.js";
import {
  handleChart,
  handleForget,
  handleInsight,
  handleQuery,
  handleTrack,
  validateForgetArgs,
} from "./handlers.js";

export type ToolRuntime = {
  mode: GmaMode;
  db: GmaDatabase;
  client?: HostedClient;
  /** Test hook: override key re-read on 401 (defaults to live resolveApiKey). */
  resolveApiKey?: () => string | undefined;
  /** Test hook: skip local→hosted backlog upload. */
  skipBacklogUpload?: boolean;
};

let localBacklogUploadedThisSession = false;

function resolveApiKeyFromRuntime(rt: ToolRuntime): string | undefined {
  return rt.resolveApiKey?.() ?? resolveApiKey();
}

export function resetRuntimeSessionForTests(): void {
  localBacklogUploadedThisSession = false;
}

async function ensureToolRuntime(rt: ToolRuntime): Promise<void> {
  const wasHosted = rt.mode === "hosted" && Boolean(rt.client);
  refreshToolRuntime(rt);
  const isHosted = rt.mode === "hosted" && Boolean(rt.client);
  if (
    !wasHosted &&
    isHosted &&
    rt.client &&
    !rt.skipBacklogUpload &&
    !localBacklogUploadedThisSession
  ) {
    localBacklogUploadedThisSession = true;
    await uploadLocalBacklogToHosted(rt.client, rt.db);
  }
}

async function hostedCall<T>(
  rt: ToolRuntime,
  run: (client: HostedClient) => Promise<T>,
): Promise<T> {
  const client = rt.client;
  if (!client) throw new Error("hosted client missing");
  const resolveKey = rt.resolveApiKey;
  return resolveKey
    ? callWithCredentialRefresh(client, run, resolveKey)
    : callWithCredentialRefresh(client, run);
}

export async function runTrack(
  rt: ToolRuntime,
  args: Parameters<typeof handleTrack>[1],
): Promise<ReturnType<typeof handleTrack>> {
  await ensureToolRuntime(rt);
  if (rt.mode === "hosted" && rt.client) {
    const remote = await hostedCall(rt, (c) => c.track(args));
    handleTrack(rt.db, args);
    return withTokensEstimate(remote);
  }
  return handleTrack(rt.db, args);
}

export async function runForget(
  rt: ToolRuntime,
  args: Parameters<typeof handleForget>[1],
): Promise<ReturnType<typeof handleForget>> {
  validateForgetArgs(args);
  await ensureToolRuntime(rt);
  if (rt.mode === "hosted" && rt.client) {
    const remote = await hostedCall(rt, (c) => c.forget(args));
    handleForget(rt.db, args);
    return withTokensEstimate(remote);
  }
  return handleForget(rt.db, args);
}

export async function runQuery(
  rt: ToolRuntime,
  args: Parameters<typeof handleQuery>[1],
): Promise<Record<string, unknown>> {
  await ensureToolRuntime(rt);
  if (rt.mode === "hosted" && rt.client) {
    return hostedCall(rt, (c) => c.query(args));
  }
  return handleQuery(rt.db, args);
}

export async function runInsight(
  rt: ToolRuntime,
  args: Parameters<typeof handleInsight>[1],
): Promise<ReturnType<typeof handleInsight>> {
  await ensureToolRuntime(rt);
  if (rt.mode === "hosted" && rt.client) {
    return (await hostedCall(rt, (c) => c.insight(args))) as ReturnType<
      typeof handleInsight
    >;
  }
  return handleInsight(rt.db, args);
}

export async function runChart(
  rt: ToolRuntime,
  args: Parameters<typeof handleChart>[1] & {
    share?: boolean;
    include_embed?: boolean;
  },
): Promise<Record<string, unknown>> {
  const wantsShare = args.share !== false;
  const forcedLocal =
    process.env.GRAPHMYANYTHING_MODE?.trim().toLowerCase() === "local";
  if (wantsShare && !forcedLocal && !resolveApiKeyFromRuntime(rt)) {
    throwChartShareRequiresSignIn();
  }
  await ensureToolRuntime(rt);
  if (wantsShare && rt.mode === "local") {
    throwChartShareRequiresSignIn();
  }
  if (rt.mode === "hosted" && rt.client) {
    const { include_embed: _embed, ...apiArgs } = args;
    const remote = (await hostedCall(rt, (c) =>
      c.chart(apiArgs),
    )) as Record<string, unknown>;
    const local = handleChart(rt.db, args);
    const merged = mergeHostedChartResponse(remote, {
      includeEmbed: args.include_embed === true,
      localPath: local.path,
      share: args.share,
    });
    return withTokensEstimate(merged);
  }
  return handleChart(rt.db, args);
}