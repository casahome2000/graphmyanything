import http from "node:http";
import type { AddressInfo } from "node:net";

export type MockHostedState = {
  points: {
    metric: string;
    ts: number;
    value: number;
    tags: Record<string, string>;
  }[];
  deviceAuthorized?: boolean;
  /** If set, only these Bearer tokens pass the auth gate (default `gma_test_key`). */
  acceptedApiKeys?: string[];
  /** Return 401 from GET /account even when the Bearer token is accepted. */
  forceAccount401?: boolean;
};

export function createMockHostedApi(
  state: MockHostedState = { points: [], deviceAuthorized: true },
): Promise<{ baseUrl: string; close: () => Promise<void> }> {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const path = url.pathname;

    const send = (code: number, body: unknown) => {
      res.writeHead(code, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
    };

  const readBody = async (): Promise<unknown> => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const raw = Buffer.concat(chunks).toString("utf8");
      return raw ? JSON.parse(raw) : {};
    };

    void (async () => {
      if (req.method === "POST" && path === "/api/v1/device/start") {
        return send(200, {
          device_code: "dev_test",
          user_code: "TEST-0000",
          verification_uri: "https://graphmyanything.com/connect",
          interval: 0,
          expires_in: 60,
        });
      }

      if (req.method === "POST" && path === "/api/v1/device/token") {
        const body = (await readBody()) as { device_code?: string };
        if (body.device_code !== "dev_test" || !state.deviceAuthorized) {
          return send(200, { status: "pending" });
        }
        return send(200, { status: "authorized", api_key: "gma_test_key" });
      }

      const auth = req.headers.authorization ?? "";
      const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
      const accepted = state.acceptedApiKeys ?? ["gma_test_key"];
      if (!accepted.includes(bearer)) {
        return send(401, { error: "unauthorized" });
      }

      if (req.method === "GET" && path === "/api/v1/account") {
        if (state.forceAccount401) {
          return send(401, { error: "Invalid or revoked API key." });
        }
        return send(200, {
          plan: "pro",
          limits: { max_points: 1_000_000, max_metrics: 1000 },
          usage: { points: state.points.length, metrics: 1 },
        });
      }

      if (req.method === "POST" && path === "/api/v1/track/batch") {
        const body = (await readBody()) as {
          points?: MockHostedState["points"];
        };
        let written = 0;
        let replaced = 0;
        for (const p of body.points ?? []) {
          const idx = state.points.findIndex(
            (x) => x.metric === p.metric && x.ts === p.ts,
          );
          if (idx >= 0) {
            state.points[idx] = p;
            replaced += 1;
          } else {
            state.points.push(p);
            written += 1;
          }
        }
        return send(200, { written, replaced });
      }

      if (req.method === "POST" && path === "/api/v1/track") {
        const body = (await readBody()) as {
          metric: string;
          value?: number;
          points?: { value: number; ts?: number; tags?: Record<string, string> }[];
          tags?: Record<string, string>;
        };
        const now = Math.floor(Date.now() / 1000);
        const toWrite =
          body.points?.map((p) => ({
            metric: body.metric,
            ts: p.ts ?? now,
            value: p.value,
            tags: { ...body.tags, ...p.tags },
          })) ?? [
            {
              metric: body.metric,
              ts: now,
              value: body.value ?? 0,
              tags: body.tags ?? {},
            },
          ];
        let written = 0;
        let replaced = 0;
        for (const p of toWrite) {
          const idx = state.points.findIndex(
            (x) => x.metric === p.metric && x.ts === p.ts,
          );
          if (idx >= 0) {
            state.points[idx] = p;
            replaced += 1;
          } else {
            state.points.push(p);
            written += 1;
          }
        }
        return send(200, {
          ok: true,
          metric: body.metric,
          written,
          replaced,
        });
      }

      if (req.method === "GET" && path === "/api/v1/query") {
        const metric = url.searchParams.get("metric") ?? "";
        return send(200, {
          m: metric,
          rg: url.searchParams.get("range") ?? "all",
          s: { l: 1, n: state.points.length },
          tokens_estimate: 50,
        });
      }

      if (req.method === "GET" && path === "/api/v1/chart") {
        const metric = url.searchParams.get("metric") ?? "m";
        const share = url.searchParams.get("share") !== "false";
        return send(200, {
          url: share ? `https://graphmyanything.com/c/ch_mock` : null,
          embed_svg: `<svg data-metric="${metric}"></svg>`,
          embed_png: "iVBORw0KGgo=",
          tokens_estimate: 80,
        });
      }

      send(404, { error: "not found" });
    })().catch(() => send(500, { error: "server error" }));
  });

  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const port = (server.address() as AddressInfo).port;
      resolve({
        baseUrl: `http://127.0.0.1:${port}/api/v1`,
        close: () =>
          new Promise((r, j) => server.close((err) => (err ? j(err) : r()))),
      });
    });
    server.on("error", reject);
  });
}