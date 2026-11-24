import { describe, expect, it } from "vitest";
import {
  mergeHostedChartResponse,
  stripChartEmbedFields,
} from "../src/lib/chart-response.js";

describe("chart-response", () => {
  it("stripChartEmbedFields removes embed keys", () => {
    const out = stripChartEmbedFields({
      url: "https://graphmyanything.com/c/x",
      embed_svg: "<svg></svg>",
      embed_png: "png",
      embed_html: "<iframe>",
      tokens_estimate: 1,
    });
    expect(out.url).toBe("https://graphmyanything.com/c/x");
    expect(out.embed_svg).toBeUndefined();
    expect(out.embed_png).toBeUndefined();
    expect(out.embed_html).toBeUndefined();
  });

  it("mergeHostedChartResponse default omits embeds", () => {
    const out = mergeHostedChartResponse(
      {
        url: "https://graphmyanything.com/c/x",
        embed_svg: "a",
        embed_png: "b",
      },
      { includeEmbed: false, localPath: "/tmp/c.svg" },
    );
    expect(out.url).toBe("https://graphmyanything.com/c/x");
    expect(out.path).toBe("/tmp/c.svg");
    expect(out.embed_svg).toBeUndefined();
  });

  it("mergeHostedChartResponse keeps embeds when opted in", () => {
    const out = mergeHostedChartResponse(
      { url: "https://graphmyanything.com/c/x", embed_svg: "a" },
      { includeEmbed: true, localPath: "/tmp/c.svg" },
    );
    expect(out.embed_svg).toBe("a");
  });
});