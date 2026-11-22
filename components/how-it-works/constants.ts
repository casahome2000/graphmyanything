export const CHART_URL_FULL =
  "https://graphmyanything.com/c/stripe.mrr.png?range=90d&type=line&forecast=30d";

export const METRIC_EVENTS = [
  { label: "stripe.mrr +$420", color: "#8b5cf6" },
  { label: "agent.tokens 3.1k", color: "#22d3ee" },
  { label: "signups +12", color: "#34d399" },
  { label: "deploy.latency 420ms", color: "#a78bfa" },
  { label: "error.rate 0.02", color: "#2dd4bf" },
] as const;

export const INSIGHT_TEXT = "MRR up 18% WoW";