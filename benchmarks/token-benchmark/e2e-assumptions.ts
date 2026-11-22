/** Conservative, documented constants for end-to-end agent flows. */

const USER_Q = "Chart my last 90 days of MRR and tell me the trend.";

/** Identical user turn on every flow (counted once on turn 1). */
export const SHARED_USER_CONTEXT = `User: ${USER_Q}`;

/** Identical final assistant message on every flow (dedicated last step). */
export const SHARED_FINAL_ANSWER =
  "MRR is up 13.15% over the last 90 days (65000 → 73550). Chart saved locally; see tool output for path. Trend is upward across the window.";

export const ASSUMPTIONS = {
  userQuestion: USER_Q,
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