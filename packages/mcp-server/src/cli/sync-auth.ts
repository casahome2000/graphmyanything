import { HostedClient } from "../hosted/client.js";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function linkDevice(): Promise<
  { api_key: string; account_email?: string } | undefined
> {
  const client = new HostedClient({ apiKey: "" });
  const start = await client.deviceStart();

  console.log(
    `Visit ${start.verification_uri} and enter code ${start.user_code}`,
  );
  console.log(`Or open ${start.verification_uri}?user_code=${start.user_code}`);

  let intervalSec = start.interval;
  const deadline = Date.now() + start.expires_in * 1000;

  while (Date.now() < deadline) {
    await sleep(intervalSec * 1000);
    const tok = await client.deviceToken(start.device_code);
    if (tok.status === "authorized")
      return {
        api_key: tok.api_key,
        account_email: tok.account_email,
      };
    if (tok.status === "expired") {
      console.error("Device code expired. Run sync again.");
      return undefined;
    }
    if (tok.status === "slow_down") intervalSec += 5;
  }
  console.error("Timed out waiting for authorization.");
  return undefined;
}

export async function linkDeviceAndSync(): Promise<number> {
  const { runSync } = await import("./sync.js");
  return runSync();
}