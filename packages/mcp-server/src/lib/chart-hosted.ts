import { PACKAGE_VERSION } from "../version.js";

export function chartShareRequiresSignInMessage(): string {
  return (
    `Hosted chart links require sign-in. Run \`npx -y graphmyanything-mcp@${PACKAGE_VERSION} sync\`, then call chart again. ` +
    `Do not edit MCP config; just retry after sync.`
  );
}

export function throwChartShareRequiresSignIn(): never {
  throw new Error(chartShareRequiresSignInMessage());
}