import { clearStoredApiKey } from "../secrets/store.js";

export function runLogout(): number {
  clearStoredApiKey();
  console.log("Logged out. API key removed; using local mode.");
  return 0;
}