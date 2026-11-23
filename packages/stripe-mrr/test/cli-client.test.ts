import { describe, expect, it, vi } from "vitest";
import {
  createStripeClient,
  StripePermissionError,
} from "../src/cli/stripe/client.js";
import { REQUIRED_STRIPE_READ_PERMISSIONS } from "../src/cli/permissions.js";

describe("createStripeClient", () => {
  it("fails fast on 403 with permission list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        status: 403,
        json: async () => ({
          error: { message: "Missing permission: rak_subscription_read" },
        }),
      })),
    );

    const fetcher = createStripeClient("rk_test_mock");
    await expect(fetcher("/subscriptions")).rejects.toBeInstanceOf(
      StripePermissionError,
    );
    try {
      await fetcher("/subscriptions");
    } catch (e) {
      const err = e as StripePermissionError;
      for (const p of REQUIRED_STRIPE_READ_PERMISSIONS) {
        expect(err.message).toContain(p.split(" (")[0]!);
      }
    }

    vi.unstubAllGlobals();
  });
});