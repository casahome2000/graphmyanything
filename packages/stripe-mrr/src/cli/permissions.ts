export const REQUIRED_STRIPE_READ_PERMISSIONS = [
  "subscriptions (Read)",
  "customers (Read)",
  "invoices (Read)",
  "prices (Read)",
  "products (Read)",
  "coupons (Read)",
  "promotion codes (Read)",
  "credit notes (Read)",
  "refunds / charges (Read)",
] as const;

export function formatPermissionHelp(extra?: string): string {
  const list = REQUIRED_STRIPE_READ_PERMISSIONS.map((p) => `  - ${p}`).join(
    "\n",
  );
  return (
    `Stripe returned 403 (missing permission). Add these Read scopes on your restricted key:\n${list}` +
    (extra ? `\n\nStripe said: ${extra}` : "")
  );
}