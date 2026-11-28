export const MULTI_SERIES_MIN = 2;
export const MULTI_SERIES_MAX = 5;

export type SeriesInput = {
  name: string;
  label?: string;
  color?: string;
};

function normalizeName(raw: string): string {
  return raw.trim();
}

function dedupeSeries(series: SeriesInput[]): SeriesInput[] {
  const seen = new Set<string>();
  const out: SeriesInput[] = [];
  for (const s of series) {
    const key = s.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

export function resolveSeriesFromToolArgs(args: {
  metric?: string;
  metrics?: string[];
  series?: SeriesInput[];
}): SeriesInput[] {
  if (args.series && args.series.length > 0) {
    const parsed = dedupeSeries(
      args.series
        .map((s) => ({
          name: normalizeName(s.name),
          label: s.label?.trim() || undefined,
          color: s.color?.trim() || undefined,
        }))
        .filter((s) => s.name.length > 0),
    );
    if (parsed.length === 0) throw new Error("series requires at least one metric name");
    return capMultiSeries(parsed);
  }

  if (args.metrics && args.metrics.length > 0) {
    const parsed = dedupeSeries(
      args.metrics.map(normalizeName).filter(Boolean).map((name) => ({ name })),
    );
    if (parsed.length === 0) throw new Error("metrics must include at least one name");
    return capMultiSeries(parsed);
  }

  const single = normalizeName(args.metric ?? "");
  if (single) return [{ name: single }];

  throw new Error("Provide metric, metrics (2–5), or series (2–5)");
}

function capMultiSeries(series: SeriesInput[]): SeriesInput[] {
  if (series.length > MULTI_SERIES_MAX) {
    return series.slice(0, MULTI_SERIES_MAX);
  }
  if (series.length > 1 && series.length < MULTI_SERIES_MIN) {
    throw new Error(`Multi-series requires ${MULTI_SERIES_MIN}–${MULTI_SERIES_MAX} metrics`);
  }
  return series;
}

export function safeChartFileStem(series: SeriesInput[]): string {
  const title =
    series.length === 1
      ? series[0]!.name
      : series.map((s) => s.label ?? s.name).join("-");
  return title.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}