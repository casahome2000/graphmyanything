import type { LlmModelPricing } from "./llm-token-pricing";

export function costForTokens(
  model: LlmModelPricing,
  inputTokens: number,
  outputTokens: number,
): number {
  return (
    (inputTokens / 1_000_000) * model.inputPerMillion +
    (outputTokens / 1_000_000) * model.outputPerMillion
  );
}

export function formatUsd(amount: number, digits = 4): string {
  if (amount >= 1) return `$${amount.toFixed(2)}`;
  if (amount >= 0.01) return `$${amount.toFixed(3)}`;
  return `$${amount.toFixed(digits)}`;
}

export function savingsPerChart(
  model: LlmModelPricing,
  pythonIn: number,
  pythonOut: number,
  gmaIn: number,
  gmaOut: number,
): { python: number; gma: number; saved: number; pct: number } {
  const python = costForTokens(model, pythonIn, pythonOut);
  const gma = costForTokens(model, gmaIn, gmaOut);
  const saved = python - gma;
  const pct = python > 0 ? (saved / python) * 100 : 0;
  return { python, gma, saved, pct };
}

export function sessionSavings(
  perChartSaved: number,
  callsPerSession: number,
  sessionsPerMonth: number,
): { perSession: number; perMonth: number } {
  return {
    perSession: perChartSaved * callsPerSession,
    perMonth: perChartSaved * callsPerSession * sessionsPerMonth,
  };
}