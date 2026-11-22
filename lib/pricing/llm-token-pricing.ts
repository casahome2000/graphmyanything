/** Official list prices — update from provider docs. Checked date in metadata. */

export const PRICING_CHECKED_AT = "2026-11-22" as const;

export type LlmModelPricing = {
  provider: "OpenAI" | "Anthropic" | "Google";
  modelId: string;
  label: string;
  tier: "flagship" | "economy";
  /** USD per 1M input tokens */
  inputPerMillion: number;
  /** USD per 1M output tokens */
  outputPerMillion: number;
  sourceUrl: string;
  notes?: string;
};

export const LLM_MODELS: LlmModelPricing[] = [
  {
    provider: "OpenAI",
    modelId: "gpt-5.2",
    label: "GPT-5.2",
    tier: "flagship",
    inputPerMillion: 1.75,
    outputPerMillion: 14.0,
    sourceUrl: "https://platform.openai.com/docs/pricing",
  },
  {
    provider: "OpenAI",
    modelId: "gpt-5-mini",
    label: "GPT-5 mini",
    tier: "economy",
    inputPerMillion: 0.25,
    outputPerMillion: 2.0,
    sourceUrl: "https://platform.openai.com/docs/pricing",
  },
  {
    provider: "Anthropic",
    modelId: "claude-opus-4-6",
    label: "Claude Opus 4.6",
    tier: "flagship",
    inputPerMillion: 5.0,
    outputPerMillion: 25.0,
    sourceUrl: "https://docs.anthropic.com/en/docs/about-claude/pricing",
  },
  {
    provider: "Anthropic",
    modelId: "claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    tier: "economy",
    inputPerMillion: 1.0,
    outputPerMillion: 5.0,
    sourceUrl: "https://docs.anthropic.com/en/docs/about-claude/pricing",
  },
  {
    provider: "Google",
    modelId: "gemini-4-carbon",
    label: "Gemini 4 Carbon",
    tier: "flagship",
    inputPerMillion: 4.0,
    outputPerMillion: 20.0,
    sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    notes:
      "Standard paid tier after promotional period: $4/$20 per 1M effective Dec 1, 2026 (per Google pricing page).",
  },
  {
    provider: "Google",
    modelId: "gemini-3.8-flash",
    label: "Gemini 3.8 Flash",
    tier: "economy",
    inputPerMillion: 1.5,
    outputPerMillion: 7.5,
    sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    notes:
      "Standard paid tier after promotional period: $1.50/$7.50 per 1M effective Jan 1, 2027 (per Google pricing page).",
  },
];

/** Token counts per chart — estimates until published benchmark. */
export const TOKEN_ASSUMPTIONS = {
  throwawayPython: {
    label: "Throwaway Python (incl. retries)",
    inputTokens: 3_900,
    outputTokens: 2_100,
    totalTokens: 6_000,
    note: "~6k tokens per chart question (code, data, plot output, ~1.2× retry factor).",
  },
  graphMyAnything: {
    label: "GraphMyAnything query",
    inputTokens: 100,
    outputTokens: 60,
    totalTokens: 160,
    note: "Single MCP query + compact JSON reply within token_budget.",
  },
  defaultCallsPerSession: 20,
  defaultSessionsPerMonth: 22,
} as const;

/** Rounded % fewer tokens vs throwaway Python (estimate). */
export function tokenReductionPercent(): number {
  const py = TOKEN_ASSUMPTIONS.throwawayPython.totalTokens;
  const gma = TOKEN_ASSUMPTIONS.graphMyAnything.totalTokens;
  return Math.round((1 - gma / py) * 100);
}

export const PRICING_SOURCES = [
  {
    name: "OpenAI API",
    url: "https://platform.openai.com/docs/pricing",
  },
  {
    name: "Anthropic Claude API",
    url: "https://docs.anthropic.com/en/docs/about-claude/pricing",
  },
  {
    name: "Google Gemini API",
    url: "https://ai.google.dev/gemini-api/docs/pricing",
  },
] as const;