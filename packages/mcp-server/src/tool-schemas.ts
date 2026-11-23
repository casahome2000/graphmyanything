import { z } from "zod";
import {
  CHART_LABELS_DESCRIBE,
  CHART_THEME_DESCRIBE,
  CHART_TYPE_DESCRIBE,
  RANGE_DESCRIBE,
} from "./lib/chart-guide.js";

/** Zod shapes shared by MCP registration and schema validation tests. */
export const trackToolArgsSchema = z.object({
  metric: z.string(),
  value: z.number().optional(),
  points: z
    .array(
      z.object({
        value: z.number(),
        ts: z.number().optional(),
        tags: z.record(z.string()).optional(),
      }),
    )
    .optional(),
  tags: z.record(z.string()).optional(),
});

export const queryToolArgsSchema = z.object({
  metric: z.string(),
  range: z.string().optional(),
  token_budget: z.number().optional(),
  points: z.union([z.number().min(0), z.literal("auto")]).optional(),
  also_chart: z.boolean().optional(),
});

export const insightToolArgsSchema = z.object({
  metric: z.string(),
  range: z.string().optional(),
});

export const chartToolArgsSchema = z.object({
  metric: z.string(),
  range: z.string().optional(),
  type: z.enum(["line", "bar", "area"]).optional(),
  theme: z.enum(["dark", "light"]).optional(),
  labels: z.enum(["none", "last", "extremes", "all"]).optional(),
});

export const FORGET_TOOL_DESCRIPTION =
  "Delete points (metric req). Modes in usage-guide.";

export const forgetToolArgsSchema = z.object({
  metric: z.string(),
  ts: z.number().optional(),
  from: z.number().optional(),
  to: z.number().optional(),
  all: z.boolean().optional(),
  confirm: z.boolean().optional(),
});

export const GMA_TOOL_ARG_SCHEMAS: Record<string, z.ZodTypeAny> = {
  track: trackToolArgsSchema,
  query: queryToolArgsSchema,
  insight: insightToolArgsSchema,
  chart: chartToolArgsSchema,
  forget: forgetToolArgsSchema,
};

export const trackToolInputSchema = {
  metric: z.string(),
  value: z.number().optional(),
  points: z
    .array(
      z.object({
        value: z.number(),
        ts: z.number().optional(),
        tags: z.record(z.string()).optional(),
      }),
    )
    .optional(),
  tags: z.record(z.string()).optional(),
};

export const queryToolInputSchema = {
  metric: z.string(),
  range: z.string().optional().describe(RANGE_DESCRIBE),
  token_budget: z.number().optional(),
  points: z.union([z.number().min(0), z.literal("auto")]).optional(),
  also_chart: z.boolean().optional(),
};

export const insightToolInputSchema = {
  metric: z.string(),
  range: z.string().optional(),
};

export const chartToolInputSchema = {
  metric: z.string(),
  range: z.string().optional().describe(RANGE_DESCRIBE),
  type: z.enum(["line", "bar", "area"]).optional().describe(CHART_TYPE_DESCRIBE),
  theme: z.enum(["dark", "light"]).optional().describe(CHART_THEME_DESCRIBE),
  labels: z
    .enum(["none", "last", "extremes", "all"])
    .optional()
    .describe(CHART_LABELS_DESCRIBE),
};

export const forgetToolInputSchema = {
  metric: z.string(),
  ts: z.number().optional(),
  from: z.number().optional(),
  to: z.number().optional(),
  all: z.boolean().optional(),
  confirm: z.boolean().optional(),
};