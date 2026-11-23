const RESTRICTED = /^rk_(live|test)_[A-Za-z0-9_]+$/;
const SECRET = /^sk_(live|test)_/;

export const SK_KEY_MESSAGE =
  "STRIPE_RESTRICTED_KEY must be a read-only restricted key (rk_live_… or rk_test_…), not a secret key (sk_…). Create one in the Stripe Dashboard with read permissions only.";

export function readStripeRestrictedKey(env = process.env): string {
  const raw = env.STRIPE_RESTRICTED_KEY?.trim();
  if (!raw) {
    throw new Error(
      "Set STRIPE_RESTRICTED_KEY to a restricted read-only key (rk_live_… or rk_test_…).",
    );
  }
  if (SECRET.test(raw)) {
    throw new Error(SK_KEY_MESSAGE);
  }
  if (!RESTRICTED.test(raw)) {
    throw new Error(
      "STRIPE_RESTRICTED_KEY must start with rk_live_ or rk_test_.",
    );
  }
  return raw;
}

/** For error messages only — never log full key. */
export function keyHint(key: string): string {
  if (key.length < 12) return "rk_…";
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}