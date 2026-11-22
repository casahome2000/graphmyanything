/** Slightly noisy upward MRR series (48 points) for the chart beat */
export function buildMrrSeries(count = 48): number[] {
  const values: number[] = [];
  for (let i = 0; i < count; i++) {
    const trend = 8.2 + i * 0.22;
    const season = Math.sin(i / 5.5) * 0.35;
    const noise = (Math.sin(i * 1.7) + Math.cos(i * 0.9)) * 0.18;
    values.push(trend + season + noise);
  }
  return values;
}

export const AGENT_LINE = 'gma.track("stripe.mrr", 12400)';
export const QUERY_LINE = 'gma.query("stripe.mrr", token_budget=200)';

export const QUERY_JSON = `{
  "trend": "+18% WoW",
  "points": 48
}`;

export const CHART_URL_DISPLAY = "graphmyanything.com/c/stripe.mrr";
export const CHART_URL_FULL =
  "https://graphmyanything.com/c/stripe.mrr.png?range=90d&type=line&forecast=30d";