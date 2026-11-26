const API_KEY_RE = /gma_[A-Za-z0-9_-]+/g;

/** Mask a saved API key for CLI output (short prefix and suffix only). */
export function maskApiKey(key: string | undefined | null): string {
  if (!key?.trim()) return "(none)";
  const k = key.trim();
  if (k.length <= 8) return `${k.slice(0, 2)}…${k.slice(-2)}`;
  return `${k.slice(0, 4)}…${k.slice(-4)}`;
}

/** Redact bearer-style API keys embedded in arbitrary text (errors, logs). */
export function redactSecretsInText(text: string): string {
  return text.replace(API_KEY_RE, (match) => maskApiKey(match));
}