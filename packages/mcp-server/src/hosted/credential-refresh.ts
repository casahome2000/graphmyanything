import { PACKAGE_VERSION } from "../version.js";
import { resolveApiKey } from "../mode.js";
import { HostedApiError, HostedClient } from "./client.js";

/** HTTP 401 or API error text indicating the bearer key is invalid or revoked. */
export function isApiKeyRejectedError(error: unknown): boolean {
  if (!(error instanceof HostedApiError)) return false;
  if (error.status === 401) return true;
  const m = error.message.toLowerCase();
  return (
    m.includes("unauthorized") ||
    m.includes("revoked") ||
    (m.includes("invalid") && m.includes("key"))
  );
}

export function staleApiKeyToolError(): Error {
  return new Error(
    `API key rejected (revoked or stale). Run \`npx -y graphmyanything-mcp@${PACKAGE_VERSION} sync\`, then restart the MCP server (reload mcp.json in your client) so the running process picks up the new key.`,
  );
}

export function formatDoctorSyncCommand(): string {
  return `npx -y graphmyanything-mcp@${PACKAGE_VERSION} sync`;
}

export async function callWithCredentialRefresh<T>(
  client: HostedClient,
  operation: (client: HostedClient) => Promise<T>,
  resolveKey: () => string | undefined = () => resolveApiKey(),
): Promise<T> {
  try {
    return await operation(client);
  } catch (error) {
    if (!isApiKeyRejectedError(error)) throw error;
    const held = client.getApiKey();
    const fresh = resolveKey();
    if (!fresh || fresh === held) {
      throw staleApiKeyToolError();
    }
    client.setApiKey(fresh);
    try {
      return await operation(client);
    } catch (retryError) {
      if (isApiKeyRejectedError(retryError)) {
        throw staleApiKeyToolError();
      }
      throw retryError;
    }
  }
}