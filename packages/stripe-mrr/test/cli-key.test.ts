import { describe, expect, it } from "vitest";
import { readStripeRestrictedKey, SK_KEY_MESSAGE } from "../src/cli/key.js";

describe("readStripeRestrictedKey", () => {
  it("accepts rk_test keys", () => {
    expect(
      readStripeRestrictedKey({
        STRIPE_RESTRICTED_KEY: "rk_test_abc123xyz",
      }),
    ).toBe("rk_test_abc123xyz");
  });

  it("rejects sk_ secret keys", () => {
    expect(() =>
      readStripeRestrictedKey({ STRIPE_RESTRICTED_KEY: "sk_test_abc" }),
    ).toThrow(SK_KEY_MESSAGE);
  });

  it("rejects missing key", () => {
    expect(() => readStripeRestrictedKey({})).toThrow(/STRIPE_RESTRICTED_KEY/);
  });
});