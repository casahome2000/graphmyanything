import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawn, type ChildProcess } from "node:child_process";
import { chromium, type Page } from "playwright";
import { buildWaitlistConfirmationEmail } from "../lib/email/waitlist-confirmation";

const ROOT = process.cwd();
const ARTIFACTS = "/opt/cursor/artifacts";
const PUBLIC_DIR = join(ROOT, "public");
const CHART_PATH = join(PUBLIC_DIR, "email/waitlist-sparkline.png");
const ICONS_HTML = join(ROOT, "scripts/email-icons-surface.html");
const CHART_SOURCE = join(ROOT, "scripts/email-chart-surface.html");
const PREVIEW_PORT = 4555;
const PREVIEW_HOST = `http://127.0.0.1:${PREVIEW_PORT}`;

const ICONS = [
  { id: "track", file: "icon-track.png" },
  { id: "query", file: "icon-query.png" },
  { id: "chart", file: "icon-chart.png" },
] as const;

async function startPublicServer(): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      "npx",
      ["serve", PUBLIC_DIR, "-l", String(PREVIEW_PORT), "--no-clipboard"],
      { stdio: ["ignore", "pipe", "pipe"], cwd: ROOT },
    );
    let started = false;
    const onData = (chunk: Buffer) => {
      const text = chunk.toString();
      if (!started && /Accepting|http:\/\/127\.0\.0\.1/i.test(text)) {
        started = true;
        resolve(proc);
      }
    };
    proc.stdout?.on("data", onData);
    proc.stderr?.on("data", onData);
    proc.on("error", reject);
    setTimeout(() => {
      if (!started) {
        started = true;
        resolve(proc);
      }
    }, 4000);
  });
}

function localAssetUrls(): {
  chart: string;
  iconTrack: string;
  iconQuery: string;
  iconChart: string;
} {
  const base = `${PREVIEW_HOST}/email`;
  return {
    chart: `${base}/waitlist-sparkline.png`,
    iconTrack: `${base}/icon-track.png`,
    iconQuery: `${base}/icon-query.png`,
    iconChart: `${base}/icon-chart.png`,
  };
}

async function generateChart(browser: Awaited<ReturnType<typeof chromium.launch>>) {
  mkdirSync(dirname(CHART_PATH), { recursive: true });
  const page = await browser.newPage({
    viewport: { width: 1120, height: 400 },
    deviceScaleFactor: 1,
  });
  await page.goto(pathToFileURL(CHART_SOURCE).href);
  await page.screenshot({ path: CHART_PATH, type: "png" });
  await page.close();
  console.log("Chart asset:", CHART_PATH);
}

async function generateIcons(browser: Awaited<ReturnType<typeof chromium.launch>>) {
  const page = await browser.newPage({
    viewport: { width: 360, height: 360 },
    deviceScaleFactor: 2,
  });
  await page.goto(pathToFileURL(ICONS_HTML).href);

  for (const { id, file } of ICONS) {
    await page.evaluate((tileId) => {
      document.querySelectorAll(".tile").forEach((el) => {
        (el as HTMLElement).style.display = "none";
      });
      const t = document.getElementById(tileId);
      if (t) t.style.display = "flex";
    }, id);
    const out = join(PUBLIC_DIR, "email", file);
    const tile = page.locator(`#${id}`);
    await tile.screenshot({ path: out, type: "png" });
    console.log("Icon:", out);
  }
  await page.close();
}

async function assertAllImagesLoaded(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
  const report = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("img")).map((img) => ({
      src: img.getAttribute("src") ?? "",
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    }));
  });
  const failed = report.filter(
    (r) => !r.complete || r.naturalWidth <= 0,
  );
  if (failed.length > 0) {
    throw new Error(
      `Email preview images failed to load:\n${JSON.stringify(failed, null, 2)}`,
    );
  }
  console.log(`All ${report.length} images loaded OK`);
}

async function screenshotEmail(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  html: string,
  viewportWidth: number,
  outPath: string,
) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: viewportWidth, height: 900 });
  await page.setContent(html, {
    waitUntil: "networkidle",
    timeout: 60_000,
  });
  await assertAllImagesLoaded(page);

  const card = page.locator("table.email-card").first();
  await card.screenshot({ path: outPath, type: "png" });
  await page.close();
}

async function main() {
  mkdirSync(ARTIFACTS, { recursive: true });
  mkdirSync(join(PUBLIC_DIR, "email"), { recursive: true });

  const server = await startPublicServer();

  try {
    const browser = await chromium.launch();
    await generateChart(browser);
    await generateIcons(browser);

    const preorder =
      process.env.NEXT_PUBLIC_PREORDER_URL?.trim() ||
      "https://graphmyanything.com";

    const { html, text } = buildWaitlistConfirmationEmail({
      preorderUrl: preorder,
      assetUrls: localAssetUrls(),
      siteLink: "https://graphmyanything.com",
    });

    writeFileSync(join(ARTIFACTS, "waitlist-email-preview.html"), html, "utf8");
    writeFileSync(join(ARTIFACTS, "waitlist-email-preview.txt"), text, "utf8");

    await screenshotEmail(
      browser,
      html,
      700,
      join(ARTIFACTS, "waitlist-email-desktop.png"),
    );
    await screenshotEmail(
      browser,
      html,
      390,
      join(ARTIFACTS, "waitlist-email-mobile.png"),
    );

    await browser.close();
    console.log("Screenshots in", ARTIFACTS);
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});