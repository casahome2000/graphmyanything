import { describe, expect, it } from "vitest";
import { GMA_TOOL_ARG_SCHEMAS } from "../src/tool-schemas.js";
import { DOC_EXAMPLE_TOOL_CALLS } from "./doc-example-args.js";

describe("docs/examples.md tool arguments", () => {
  it("each documented example validates against the tool Zod schema", () => {
    for (const ex of DOC_EXAMPLE_TOOL_CALLS) {
      const schema = GMA_TOOL_ARG_SCHEMAS[ex.tool];
      expect(schema, `missing schema for ${ex.tool}`).toBeDefined();
      const parsed = schema!.safeParse(ex.arguments);
      expect(parsed.success, `${ex.id}: ${parsed.error?.message}`).toBe(true);
    }
  });

  it("covers all four tools", () => {
    const tools = new Set(DOC_EXAMPLE_TOOL_CALLS.map((e) => e.tool));
    expect([...tools].sort()).toEqual(["chart", "insight", "query", "track"]);
  });
});