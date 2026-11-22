import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { buildWaitlistConfirmationEmail } from "../lib/email/waitlist-confirmation";

const ROOT = process.cwd();
const ARTIFACTS = "/opt/cursor/artifacts";
const CHART_PATH = join(ROOT, "public/email/waitlist-sparkline.png");
const ICONS_HTML = join(ROOT, "scripts/email-icons-surface.html");
const CHART_SOURCE = join(ROOT, "scripts/email-chart-surface.html");

const ICONS = [
  { id: "track", file: "icon-track.png" },
  { id: "query", file: "icon-query.png" },
  { id: "chart", file: "icon-chart.png" },
] as const;

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
  const page = await browser.newPage({ viewport: { width: 256, height: 256 } });
  await page.goto(pathToFileURL(ICONS_HTML).href);

  for (const { id, file } of ICONS) {
    await page.evaluate((tileId) => {
      document.querySelectorAll(".tile").forEach((el) => {
        (el as HTMLElement).style.display = "none";
      });
      const t = document.getElementById(tileId);
      if (t) t.style.display = "flex";
    }, id);
    const out = join(ROOT, "public/email", file);
    const tile = page.locator(`#${id}`);
    await tile.screenshot({ path: out, type: "png" });
    console.log("Icon:", out);
  }
  await page.close();
}

function localAssetUrls() {
  return {
    chart: pathToFileURL(CHART_PATH).href,
    iconTrack: pathToFileURL(join(ROOT, "public/email/icon-track.png")).href,
    iconQuery: pathToFileURL(join(ROOT, "public/email/icon-query.png")).href,
    iconChart: pathToFileURL(join(ROOT, "public/email/icon-chart.png")).href,
  };
}

async function screenshotEmail(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  html: string,
  viewportWidth: number,
  outPath: string,
) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: viewportWidth, height: 900 });
  await page.setContent(html, { waitUntil: "load" });
  await page.waitForTimeout(200);

  const card = page.locator("table.email-card").first();
  await card.screenshot({ path: outPath, type: "png" });
  await page.close();
}

async function main() {
  mkdirSync(ARTIFACTS, { recursive: true });
  mkdirSync(join(ROOT, "public/email"), { recursive: true });

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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});