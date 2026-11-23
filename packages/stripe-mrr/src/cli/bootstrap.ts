const MIN_NODE = { major: 22, minor: 0, patch: 0 };

function parseNodeVersion(raw: string): {
  major: number;
  minor: number;
  patch: number;
} {
  const [major, minor, patch] = raw
    .split(".")
    .map((n) => Number.parseInt(n, 10) || 0);
  return { major, minor, patch };
}

function nodeTooOld(current: string): boolean {
  const v = parseNodeVersion(current);
  if (v.major !== MIN_NODE.major) return v.major < MIN_NODE.major;
  if (v.minor !== MIN_NODE.minor) return v.minor < MIN_NODE.minor;
  return v.patch < MIN_NODE.patch;
}

export function assertNodeVersion(): void {
  if (nodeTooOld(process.versions.node)) {
    console.error(
      `graphmyanything-stripe requires Node.js >=${MIN_NODE.major}.${MIN_NODE.minor}.${MIN_NODE.patch}. ` +
        `You are on ${process.versions.node}.`,
    );
    process.exit(1);
  }
}