import { describe, expect, it } from "vitest";
import { maskApiKey, redactSecretsInText } from "../src/lib/mask-secret.js";

describe("maskApiKey", () => {
  it("shows only last four characters", () => {
    expect(maskApiKey("gma_test_secret_key_1234")).toBe("gma_…1234");
  });
  it("never returns the full key", () => {
    const key = "gma_abcdefghijklmnop";
    const masked = maskApiKey(key);
    expect(masked).not.toContain(key);
    expect(masked.endsWith("mnop")).toBe(true);
    expect(masked.startsWith("gma_")).toBe(true);
  });
});

describe("redactSecretsInText", () => {
  it("redacts embedded API keys in error strings", () => {
    const text = "Bearer gma_leaked_in_body failed";
    expect(redactSecretsInText(text)).toBe("Bearer gma_…body failed");
  });
});