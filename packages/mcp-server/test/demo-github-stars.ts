/** Illustrative GitHub star demo for docs/tests (not live API sync). */

export const GITHUB_STARS_METRIC = "github.stars.modelcontextprotocol.servers";

/** Star count from GitHub API at fetch time (see PR notes). */
export const GITHUB_STARS_CURRENT = 92_228;

/** 14 daily snapshots ending 2025-11-24 UTC (illustrative gains). */
export function githubStarsBackfill14(): { ts: number; value: number }[] {
  const values = [
    90_862, 90_928, 90_985, 91_052, 91_110, 91_168, 91_225, 91_290, 91_355,
    91_420, 91_495, 91_580, 91_890, GITHUB_STARS_CURRENT,
  ];
  const start = Date.UTC(2025, 10, 11) / 1000;
  return values.map((value, i) => ({ ts: start + i * 86_400, value }));
}

/** Four weekly snapshots for chart samples (same cadence as prior weight demo). */
export function githubStars4(): { ts: number; value: number }[] {
  const base = Date.UTC(2025, 0, 6) / 1000;
  return [
    { ts: base, value: 92_120 },
    { ts: base + 7 * 86_400, value: 92_155 },
    { ts: base + 14 * 86_400, value: 92_190 },
    { ts: base + 21 * 86_400, value: 92_228 },
  ];
}