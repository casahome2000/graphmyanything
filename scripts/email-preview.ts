import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { chromium } from "playwright";
import { buildWaitlistConfirmationEmail } from "../lib/email/waitlist-confirmation";

const ROOT = process.cwd();
const ARTIFACTS = "/opt/cursor/artifacts";
const CHART_PATH = join(ROOT, "public/email/waitlist-sparkline.png");
const CHART_HTML = join(ROOT, "scripts/email-chart-surface.html");

async function ensureChartAsset() {
  mkdirSync(dirname(CHART_PATH), { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 536, height: 168 },
    deviceScaleFactor: 2,
  });
  await page.goto(`file://${CHART_HTML}`);
  await page.screenshot({ path: CHART_PATH, type: "png" });
  await browser.close();
  console.log("Chart asset:", CHART_PATH);
}

async function main() {
  if (!existsSync(CHART_PATH)) {
    await ensureChartAsset();
  }

  mkdirSync(ARTIFACTS, { recursive: true });

  const preorder =
    process.env.NEXT_PUBLIC_PREORDER_URL?.trim() ||
    "https://graphmyanything.com";

  const { html, text } = buildWaitlistConfirmationEmail({
    preorderUrl: preorder,
  });

  const htmlPath = join(ARTIFACTS, "waitlist-email-preview.html");
  writeFileSync(htmlPath, html, "utf8");
  writeFileSync(join(ARTIFACTS, "waitlist-email-preview.txt"), text, "utf8");
  console.log("Wrote", htmlPath);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });

  await page.setViewportSize({ width: 700, height: 1200 });
  await page.screenshot({
    path: join(ARTIFACTS, "waitlist-email-desktop.png"),
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 1400 });
  await page.screenshot({
    path: join(ARTIFACTS, "waitlist-email-mobile.png"),
    fullPage: true,
  });

  await browser.close();
  console.log("Screenshots in", ARTIFACTS);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});