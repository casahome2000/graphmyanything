import { clearApiKey } from "../config.js";

export function runLogout(): number {
  clearApiKey();
  console.log("Logged out. API key removed from config; using local mode.");
  return 0;
}