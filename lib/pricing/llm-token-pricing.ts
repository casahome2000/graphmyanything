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
    modelId: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    tier: "flagship",
    inputPerMillion: 1.25,
    outputPerMillion: 10.0,
    sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    notes: "Paid tier, prompts ≤200k tokens. Model deprecated in AI Studio; pricing still published.",
  },
  {
    provider: "Google",
    modelId: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    tier: "economy",
    inputPerMillion: 0.3,
    outputPerMillion: 2.5,
    sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    notes: "Text/image/video input rate; deprecated in AI Studio; pricing still published.",
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