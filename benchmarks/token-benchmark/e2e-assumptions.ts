/** Conservative, documented constants for end-to-end agent flows. */

export const ASSUMPTIONS = {
  userQuestion: "Chart my last 90 days of MRR and tell me the trend.",
  pointCount: 90,
  sessions: 30,
  /** Fraction of runs that need one extra fix turn after stderr (ImportError, path typo). */
  errorRetryRate: 0.3,
  /** Applied to Python-style executor output on minimal baseline only. */
  minimalOutputRetryFactor: 1.15,
  /** Frontier model for $/1k questions (OpenAI list price, Nov 2026). */
  costModel: {
    label: "GPT-5.2",
    inputPerMillion: 1.75,
    outputPerMillion: 14.0,
    source: "https://platform.openai.com/docs/pricing",
  },
} as const;

export type FlowStep = {
  name: string;
  description: string;
  toolCalls: number;
  inputText: string;
  outputText: string;
  /** Step weight for expected-value totals (default 1). */
  weight?: number;
};

export type E2EFlow = {
  id: string;
  label: string;
  phase: "cold" | "warm" | "best_case";
  steps: FlowStep[];
  wallTurns: number;
  wallToolCalls: number;
  notes: string;
};