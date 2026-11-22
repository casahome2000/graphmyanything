/** Conservative, documented constants for end-to-end agent flows. */

export const ASSUMPTIONS = {
  userQuestion: "Chart my last 90 days of MRR and tell me the trend.",
  pointCount: 90,
  sessions: 30,
  errorRetryRate: 0.3,
  minimalOutputRetryFactor: 1.15,
  costModel: {
    label: "GPT-5.2",
    inputPerMillion: 1.75,
    outputPerMillion: 14.0,
    source: "https://platform.openai.com/docs/pricing",
  },
  tokenRule:
    "Tool results enter context (input). Assistant text and tool-call args are output.",
} as const;

export type FlowStep = {
  name: string;
  description: string;
  toolCalls: number;
  /** User messages + tool results the model reads this turn. */
  contextInput: string;
  /** Model-generated text + tool-call argument JSON this turn. */
  modelOutput: string;
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