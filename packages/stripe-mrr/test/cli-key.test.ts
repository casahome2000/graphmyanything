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

  it("accepts restricted keys with extra underscores", () => {
    expect(
      readStripeRestrictedKey({
        STRIPE_RESTRICTED_KEY: "rk_live_51Abc_def_ghi",
      }),
    ).toBe("rk_live_51Abc_def_ghi");
    expect(
      readStripeRestrictedKey({
        STRIPE_RESTRICTED_KEY: "rk_test_51X_y_z",
      }),
    ).toBe("rk_test_51X_y_z");
  });

  it("rejects malformed rk_ keys", () => {
    expect(() =>
      readStripeRestrictedKey({ STRIPE_RESTRICTED_KEY: "rk_live_" }),
    ).toThrow(/rk_live_ or rk_test_/);
    expect(() =>
      readStripeRestrictedKey({ STRIPE_RESTRICTED_KEY: "rk_foo_bar" }),
    ).toThrow(/rk_live_ or rk_test_/);
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