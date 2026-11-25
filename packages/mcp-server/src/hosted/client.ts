import { redactSecretsInText } from "../lib/mask-secret.js";

export const DEFAULT_API_BASE = "https://graphmyanything.com/api/v1";

export function resolveApiBase(): string {
  const custom = process.env.GRAPHMYANYTHING_API_BASE?.trim();
  return custom ? custom.replace(/\/$/, "") : DEFAULT_API_BASE;
}

export type HostedClientOptions = {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

export class HostedApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "HostedApiError";
  }
}

export class HostedClient {
  private readonly base: string;
  private readonly key: string;
  private readonly fetchFn: typeof fetch;

  constructor(opts: HostedClientOptions) {
    this.base = (opts.baseUrl ?? resolveApiBase()).replace(/\/$/, "");
    this.key = opts.apiKey;
    this.fetchFn = opts.fetchImpl ?? fetch;
  }

  private headers(json = true): HeadersInit {
    const h: Record<string, string> = {
      Authorization: `Bearer ${this.key}`,
    };
    if (json) h["Content-Type"] = "application/json";
    return h;
  }

  private async parse<T>(res: Response): Promise<T> {
    const text = await res.text();
    let body: unknown = text;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }
    if (!res.ok) {
      const msg =
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        typeof (body as { error: unknown }).error === "string"
          ? (body as { error: string }).error
          : `HTTP ${res.status}`;
      throw new HostedApiError(redactSecretsInText(msg), res.status, body);
    }
    return body as T;
  }

  async deviceStart(): Promise<{
    device_code: string;
    user_code: string;
    verification_uri: string;
    interval: number;
    expires_in: number;
  }> {
    const res = await this.fetchFn(`${this.base}/device/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    return this.parse(res);
  }

  async deviceToken(deviceCode: string): Promise<
    | { status: "pending" }
    | { status: "slow_down" }
    | { status: "expired" }
    | { status: "authorized"; api_key: string }
  > {
    const res = await this.fetchFn(`${this.base}/device/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_code: deviceCode }),
    });
    const text = await res.text();
    let body: Record<string, unknown> = {};
    try {
      body = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      /* non-JSON body */
    }
    const key =
      typeof body.access_token === "string"
        ? body.access_token
        : typeof body.api_key === "string"
          ? body.api_key
          : undefined;
    if (res.ok && key) return { status: "authorized", api_key: key };
    // RFC 8628-style polling errors (the server answers 428/400 with an error code).
    const err = typeof body.error === "string" ? body.error : "";
    if (err === "authorization_pending" || body.status === "pending") {
      return { status: "pending" };
    }
    if (err === "slow_down") return { status: "slow_down" };
    if (err === "expired_token" || err === "invalid_grant") {
      return { status: "expired" };
    }
    throw new HostedApiError(
      redactSecretsInText(err || `HTTP ${res.status}`),
      res.status,
      body,
    );
  }

  async getAccount(): Promise<{
    plan: string;
    limits: { points?: number; metrics?: number; window_days?: number; live_links?: number };
    usage?: { points?: number; metrics?: number };
  }> {
    const res = await this.fetchFn(`${this.base}/account`, {
      headers: this.headers(false),
    });
    return this.parse(res);
  }

  async trackBatch(
    points: {
      metric: string;
      ts: number;
      value: number;
      tags?: Record<string, string>;
    }[],
  ): Promise<{ written: number; replaced: number }> {
    const res = await this.fetchFn(`${this.base}/track/batch`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ points }),
    });
    return this.parse(res);
  }

  async track(args: {
    metric: string;
    value?: number;
    points?: { value: number; ts?: number; tags?: Record<string, string> }[];
    tags?: Record<string, string>;
  }): Promise<{ ok: true; metric: string; written: number; replaced: number }> {
    const res = await this.fetchFn(`${this.base}/track`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(args),
    });
    return this.parse(res);
  }

  async forget(args: {
    metric: string;
    ts?: number;
    from?: number;
    to?: number;
    all?: boolean;
    confirm?: boolean;
  }): Promise<{ ok: true; metric: string; deleted: number }> {
    const res = await this.fetchFn(`${this.base}/forget`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(args),
    });
    return this.parse(res);
  }

  private queryString(params: Record<string, string | number | boolean | undefined>): string {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined) continue;
      q.set(k, String(v));
    }
    const s = q.toString();
    return s ? `?${s}` : "";
  }

  async query(args: {
    metric: string;
    range?: string;
    token_budget?: number;
    points?: number | "auto";
    also_chart?: boolean;
  }): Promise<Record<string, unknown>> {
    const res = await this.fetchFn(
      `${this.base}/query${this.queryString(args as Record<string, string | number | boolean | undefined>)}`,
      { headers: this.headers(false) },
    );
    return this.parse(res);
  }

  async insight(args: {
    metric: string;
    range?: string;
  }): Promise<Record<string, unknown>> {
    const res = await this.fetchFn(
      `${this.base}/insight${this.queryString(args)}`,
      { headers: this.headers(false) },
    );
    return this.parse(res);
  }

  async chart(args: {
    metric: string;
    range?: string;
    type?: string;
    theme?: string;
    labels?: string;
    share?: boolean;
  }): Promise<Record<string, unknown>> {
    const res = await this.fetchFn(
      `${this.base}/chart${this.queryString(args)}`,
      { headers: this.headers(false) },
    );
    return this.parse(res);
  }
}