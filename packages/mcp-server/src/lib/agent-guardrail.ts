/** Shown on MCP tools and in agent-facing docs. */
export const AGENT_MCP_GUARDRAIL =
  "If graphmyanything tools are not in your tool list, stop and ask the user to enable graphmyanything in their client's MCP settings. Never read ~/.graphmyanything or any credentials file, never call the hosted API directly, and never drive the stdio server by hand.";

export function withAgentGuardrail(description: string): string {
  if (description.includes(AGENT_MCP_GUARDRAIL)) return description;
  return `${description} ${AGENT_MCP_GUARDRAIL}`;
}