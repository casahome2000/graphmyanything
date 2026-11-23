/**
 * Rough token estimate for JSON tool payloads (chars ÷ 4).
 * Documented as an approximation, not a model tokenizer count.
 */
export function estimateTokens(obj: unknown): number {
  return Math.ceil(JSON.stringify(obj).length / 4);
}

export function withTokensEstimate<T extends object>(
  payload: T,
): T & { tokens_estimate: number } {
  const withMeta = { ...payload, tokens_estimate: 0 } as T & {
    tokens_estimate: number;
  };
  withMeta.tokens_estimate = estimateTokens(withMeta);
  return withMeta;
}