/** Hosted chart fields stripped unless the agent opts in via `include_embed`. */

const CHART_EMBED_KEYS = [
  "embed_svg",
  "embed_png",
  "embed_html",
  "embed_markdown",
  "embed_iframe",
] as const;

export function stripChartEmbedFields(
  remote: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...remote };
  for (const key of CHART_EMBED_KEYS) {
    delete out[key];
  }
  return out;
}

export function mergeHostedChartResponse(
  remote: Record<string, unknown>,
  opts: {
    includeEmbed: boolean;
    localPath: string;
    share?: boolean;
  },
): Record<string, unknown> {
  const share = opts.share !== false;
  let out = opts.includeEmbed ? { ...remote } : stripChartEmbedFields(remote);
  if (!share) {
    out = { ...out, url: null };
  }
  return { ...out, path: opts.localPath };
}