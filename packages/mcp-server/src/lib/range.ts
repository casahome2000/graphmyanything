/** Documented `range` values for query, insight, and chart (parseRange also accepts other `{n}d|w|m|y`). */
export const RANGE_CANONICAL = [
  "7d",
  "14d",
  "30d",
  "90d",
  "1y",
  "all",
] as const;

export const RANGE_DESCRIBE = RANGE_CANONICAL.join("|");