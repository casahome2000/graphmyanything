import { spawnSync } from "node:child_process";

const SERVICE = "graphmyanything-mcp";
const ACCOUNT = "graphmyanything";

export type KeychainBackend = {
  readonly name: string;
  get(): string | undefined;
  set(key: string): boolean;
  delete(): boolean;
  isAvailable(): boolean;
};

function run(cmd: string, args: string[], input?: string): {
  ok: boolean;
  stdout: string;
  stderr: string;
} {
  const r = spawnSync(cmd, args, {
    encoding: "utf8",
    input,
    stdio: ["pipe", "pipe", "pipe"],
  });
  return {
    ok: r.status === 0,
    stdout: (r.stdout ?? "").trim(),
    stderr: (r.stderr ?? "").trim(),
  };
}

export function macKeychainBackend(): KeychainBackend {
  return {
    name: "macOS Keychain",
    isAvailable() {
      if (process.platform !== "darwin") return false;
      const r = run("security", ["help"]);
      return r.ok || r.stderr.includes("security");
    },
    get() {
      const r = run("security", [
        "find-generic-password",
        "-a",
        ACCOUNT,
        "-s",
        SERVICE,
        "-w",
      ]);
      return r.ok && r.stdout ? r.stdout : undefined;
    },
    set(key: string) {
      this.delete();
      return run("security", [
        "add-generic-password",
        "-a",
        ACCOUNT,
        "-s",
        SERVICE,
        "-w",
        key,
        "-U",
      ]).ok;
    },
    delete() {
      return run("security", [
        "delete-generic-password",
        "-a",
        ACCOUNT,
        "-s",
        SERVICE,
      ]).ok;
    },
  };
}

export function linuxSecretToolBackend(): KeychainBackend {
  return {
    name: "Linux secret-tool",
    isAvailable() {
      if (process.platform !== "linux") return false;
      const r = run("secret-tool", ["--version"]);
      return r.ok;
    },
    get() {
      const r = run("secret-tool", [
        "lookup",
        "service",
        SERVICE,
        "username",
        ACCOUNT,
      ]);
      return r.ok && r.stdout ? r.stdout : undefined;
    },
    set(key: string) {
      return run(
        "secret-tool",
        [
          "store",
          "--label",
          "graphmyanything-mcp API key",
          "service",
          SERVICE,
          "username",
          ACCOUNT,
        ],
        `${key}\n`,
      ).ok;
    },
    delete() {
      return run("secret-tool", [
        "clear",
        "service",
        SERVICE,
        "username",
        ACCOUNT,
      ]).ok;
    },
  };
}

export function windowsCredBackend(): KeychainBackend {
  const target = `GraphMyAnything:${SERVICE}`;
  const psQuote = (s: string) => s.replace(/'/g, "''");
  return {
    name: "Windows Credential Manager",
    isAvailable() {
      return process.platform === "win32";
    },
    get() {
      const script = `
        $c = Get-StoredCredential -Target '${psQuote(target)}' -ErrorAction SilentlyContinue
        if ($c) { $c.GetNetworkCredential().Password }
      `;
      const r = run("powershell", [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        `try { Add-Type -AssemblyName System.Security; } catch {}; ${script}`,
      ]);
      if (r.ok && r.stdout) return r.stdout;
      const cmdkey = run("cmdkey", ["/list"]);
      return undefined;
    },
    set(key: string) {
      const r = run("cmdkey", [
        `/generic:${target}`,
        `/user:${ACCOUNT}`,
        `/pass:${key}`,
      ]);
      return r.ok;
    },
    delete() {
      return run("cmdkey", [`/delete:${target}`]).ok;
    },
  };
}

/** cmdkey-backed backend (no extra PowerShell modules). */
export function windowsCmdKeyBackend(): KeychainBackend {
  const target = `GraphMyAnything:${SERVICE}`;
  return {
    name: "Windows Credential Manager",
    isAvailable() {
      return process.platform === "win32";
    },
    get() {
      return undefined;
    },
    set(key: string) {
      this.delete();
      return run("cmdkey", [
        `/generic:${target}`,
        `/user:${ACCOUNT}`,
        `/pass:${key}`,
      ]).ok;
    },
    delete() {
      return run("cmdkey", [`/delete:${target}`]).ok;
    },
  };
}

export function pickKeychainBackend(
  custom?: KeychainBackend,
): KeychainBackend | undefined {
  if (custom) return custom.isAvailable() ? custom : undefined;
  const candidates = [
    macKeychainBackend(),
    linuxSecretToolBackend(),
    windowsCmdKeyBackend(),
  ];
  return candidates.find((b) => b.isAvailable());
}