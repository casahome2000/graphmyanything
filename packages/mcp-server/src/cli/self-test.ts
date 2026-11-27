import { formatApiKeyStorageLine } from "../lib/api-key-storage-line.js";
import { HostedClient } from "../hosted/client.js";
import {
  formatDoctorSyncCommand,
  isApiKeyRejectedError,
} from "../hosted/credential-refresh.js";
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

  const key = resolveApiKey();
  console.log(formatApiKeyStorageLine());

  try {
    await new HostedClient({ apiKey: "" }).deviceStart();
    if (key) {
      await new HostedClient({ apiKey: key }).getAccount();
      console.log("Hosted API: reachable (account OK)");
    } else {
      console.log("Hosted API: reachable (device/start OK)");
    }
  } catch (e) {
    if (key && isApiKeyRejectedError(e)) {
      console.error(
        "Hosted API: API key rejected (revoked or from a deleted account)",
      );
      console.error(`Next: ${formatDoctorSyncCommand()}`);
      exit = 1;
    } else {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`Hosted API: unreachable (${msg})`);
      exit = 1;
    }
  }

  return exit;
}