import { describe, expect, it } from "vitest";
import { HostedClient } from "../src/hosted/client.js";

function stub(status: number, body: unknown): typeof fetch {
  return (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })) as typeof fetch;
}

describe("deviceToken matches the hosted API contract", () => {
  const mk = (status: number, body: unknown) =>
    new HostedClient({ apiKey: "", baseUrl: "http://x/api/v1", fetchImpl: stub(status, body) });

  it("treats 428 authorization_pending as pending", async () => {
    await expect(mk(428, { error: "authorization_pending" }).deviceToken("d")).resolves.toEqual({ status: "pending" });
  });
  it("treats slow_down and expired_token", async () => {
    await expect(mk(400, { error: "slow_down" }).deviceToken("d")).resolves.toEqual({ status: "slow_down" });
    await expect(mk(400, { error: "expired_token" }).deviceToken("d")).resolves.toEqual({ status: "expired" });
  });
  it("accepts access_token on success", async () => {
    await expect(
      mk(200, { ok: true, access_token: "gma_abc", token_type: "Bearer" }).deviceToken("d"),
    ).resolves.toEqual({ status: "authorized", api_key: "gma_abc" });
  });
  it("accepts account_email when present", async () => {
    await expect(
      mk(200, {
        ok: true,
        access_token: "gma_abc",
        account_email: "you@example.com",
      }).deviceToken("d"),
    ).resolves.toEqual({
      status: "authorized",
      api_key: "gma_abc",
      account_email: "you@example.com",
    });
  });
  it("throws on unknown errors", async () => {
    await expect(mk(500, { error: "Something went wrong." }).deviceToken("d")).rejects.toThrow();
  });
});
