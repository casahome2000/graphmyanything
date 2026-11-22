import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "GraphMyAnything — The place agents keep their numbers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "#06060a",
          padding: 80,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(139,92,246,0.35), transparent)",
          }}
        />
        <div
          style={{
            fontSize: 28,
            color: "#8b8b9e",
            marginBottom: 24,
            letterSpacing: "-0.02em",
          }}
        >
          graphmyanything.com
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#f4f4f7",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            maxWidth: 900,
          }}
        >
          The place agents keep their numbers.
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#8b8b9e",
            marginTop: 32,
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          Metric memory for AI agents — track, query, insight, chart via MCP.
        </div>
        <div
          style={{
            marginTop: 48,
            display: "flex",
            gap: 12,
            fontSize: 22,
            color: "#22d3ee",
          }}
        >
          track · query · insight · chart
        </div>
      </div>
    ),
    { ...size },
  );
}