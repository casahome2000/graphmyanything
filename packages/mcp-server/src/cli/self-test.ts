import { readConfig, resolveConfigPath } from "../config.js";
import { HostedClient } from "../hosted/client.js";
import { maskApiKey } from "../lib/mask-secret.js";
import { MIN_NODE, nodeTooOld } from "../bootstrap.js";
import { resolveApiKey } from "../mode.js";

export async function runSelfTest(): Promise<number> {
  let exit = 0;

  const nodeOk = !nodeTooOld(process.versions.node);
  console.log(
    nodeOk
      ? `Node.js ${process.versions.node}: OK (requires >=${MIN_NODE.major}.${MIN_NODE.minor}.${MIN_NODE.patch})`
      : `Node.js ${process.versions.node}: FAIL (requires >=${MIN_NODE.major}.${MIN_NODE.minor}.${MIN_NODE.patch})`,
  );
  if (!nodeOk) exit = 1;

  const config = readConfig();
  const key = resolveApiKey(config);
  const fromEnv =
    Boolean(process.env.GRAPHMYANYTHING_API_KEY?.trim()) ||
    Boolean(process.env.GMA_API_KEY?.trim());
  const credPath = resolveConfigPath();
  if (key) {
    console.log(
      `Credentials: API key ${fromEnv ? "from environment" : "saved"} ${maskApiKey(key)} (${credPath})`,
    );
  } else {
    console.log(`Credentials: no API key saved (${credPath})`);
  }

  try {
    await new HostedClient({ apiKey: "" }).deviceStart();
    if (key) {
      await new HostedClient({ apiKey: key }).getAccount();
      console.log("Hosted API: reachable (account OK)");
    } else {
      console.log("Hosted API: reachable (device/start OK)");
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`Hosted API: unreachable (${msg})`);
    exit = 1;
  }

  return exit;
}