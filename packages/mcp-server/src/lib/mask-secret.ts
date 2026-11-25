const API_KEY_RE = /gma_[A-Za-z0-9_-]+/g;

/** Mask a saved API key for CLI output (last 4 chars only). */
export function maskApiKey(key: string | undefined | null): string {
  if (!key?.trim()) return "(none)";
  const k = key.trim();
  if (k.length <= 4) return `…${k}`;
  return `…${k.slice(-4)}`;
}

/** Redact bearer-style API keys embedded in arbitrary text (errors, logs). */
export function redactSecretsInText(text: string): string {
  return text.replace(API_KEY_RE, (match) => maskApiKey(match));
}