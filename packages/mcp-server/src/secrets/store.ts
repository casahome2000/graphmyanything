import fs from "node:fs";
import {
  DEFAULT_CREDENTIALS_PATH,
  LEGACY_CONFIG_PATH,
  readConfig,
  writeConfig,
  type GmaConfig,
} from "../config.js";
import {
  pickKeychainBackend,
  type KeychainBackend,
} from "./keychain-backend.js";

let injected: KeychainBackend | undefined | null = null;
let fallbackNotified = false;

export function setKeychainBackendForTests(b?: KeychainBackend | null): void {
  injected = b === undefined ? null : b;
}

function backend(): KeychainBackend | undefined {
  if (injected !== null) {
    return injected?.isAvailable() ? injected : undefined;
  }
  return pickKeychainBackend();
}

export function consumeKeychainFallbackNotice(): string | undefined {
  if (fallbackNotified || backend()) return undefined;
  fallbackNotified = true;
  if (process.platform === "win32") {
    return "API key will be stored in ~/.graphmyanything/credentials.json (0600) — Windows uses file storage (keychain read not supported yet).";
  }
  return "API key will be stored in ~/.graphmyanything/credentials.json (0600) — OS keychain not available on this machine.";
}

export function getStoredApiKey(): string | undefined {
  const fromChain = backend()?.get()?.trim();
  if (fromChain) return fromChain;
  migrateFileKeyToKeychain();
  const again = backend()?.get()?.trim();
  if (again) return again;
  return readConfig().api_key?.trim() || undefined;
}

export function setStoredApiKey(key: string): void {
  const kc = backend();
  if (kc?.set(key)) {
    writeConfig({
      mode: "hosted",
      secret_storage: "keychain",
      api_key: undefined,
    });
    stripApiKeyFromCredentialFiles();
    return;
  }
  const notice = consumeKeychainFallbackNotice();
  if (notice) console.error(notice);
  writeConfig({ api_key: key, mode: "hosted", secret_storage: "file" });
}

export function clearStoredApiKey(): void {
  backend()?.delete();
  const cfg = readConfig();
  delete cfg.api_key;
  cfg.mode = "local";
  delete cfg.secret_storage;
  writeConfig(cfg);
}

function stripApiKeyFromCredentialFiles(): void {
  const cfg = readConfig();
  if (cfg.api_key) {
    delete cfg.api_key;
    writeConfig(cfg);
  }
  try {
    if (fs.existsSync(LEGACY_CONFIG_PATH)) fs.unlinkSync(LEGACY_CONFIG_PATH);
  } catch {
    /* ok */
  }
}

function migrateFileKeyToKeychain(): void {
  const kc = backend();
  if (!kc) return;
  const key = readConfig().api_key?.trim();
  if (!key || !kc.set(key)) return;
  stripApiKeyFromCredentialFiles();
  writeConfig({ mode: "hosted", secret_storage: "keychain" });
  try {
    if (fs.existsSync(DEFAULT_CREDENTIALS_PATH)) {
      const raw = fs.readFileSync(DEFAULT_CREDENTIALS_PATH, "utf8");
      const parsed = JSON.parse(raw) as GmaConfig;
      if (parsed.api_key) {
        delete parsed.api_key;
        parsed.secret_storage = "keychain";
        fs.writeFileSync(
          DEFAULT_CREDENTIALS_PATH,
          JSON.stringify(
            { _warning: "secret API key, do not share", ...parsed },
            null,
            2,
          ) + "\n",
          { mode: 0o600 },
        );
      }
    }
    if (fs.existsSync(LEGACY_CONFIG_PATH)) fs.unlinkSync(LEGACY_CONFIG_PATH);
  } catch {
    /* ok */
  }
}