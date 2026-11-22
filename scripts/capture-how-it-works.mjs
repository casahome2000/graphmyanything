import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";
import { execSync } from "node:child_process";

const OUT = "/opt/cursor/artifacts";
const BASE = "http://localhost:3000";

await mkdir(OUT, { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function captureDesktop() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });
  await page.goto(`${BASE}/#how-it-works`, { waitUntil: "networkidle" });
  const el = page.locator("#how-it-works-story");
  await el.scrollIntoViewIfNeeded();
  await sleep(6200);
  await el.screenshot({ path: `${OUT}/how-story-r9-desktop-beat3.png`, type: "png" });
  await sleep(2200);
  await el.screenshot({ path: `${OUT}/how-story-r9-desktop-beat4.png`, type: "png" });
  await browser.close();
}

async function captureMobile() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    ...devices["iPhone 13"],
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  await page.goto(`${BASE}/#how-it-works`, { waitUntil: "networkidle" });
  const el = page.locator("#how-it-works-story");
  await el.scrollIntoViewIfNeeded();
  await sleep(7800);
  await el.screenshot({ path: `${OUT}/how-story-r9-mobile.png`, type: "png" });
  await browser.close();
}

async function captureVideo() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    recordVideo: { dir: "/tmp/how-story-vid", size: { width: 1280, height: 900 } },
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/#how-it-works`, { waitUntil: "networkidle" });
  const story = page.locator("#how-it-works-story");
  await story.scrollIntoViewIfNeeded();
  await sleep(400);
  const box = await story.boundingBox();
  await sleep(10200);
  const video = page.video();
  await context.close();
  await browser.close();
  const webmPath = await video.path();
  if (box) {
    const W = 1280; const H = 900;
    const w = Math.min(Math.max(2, Math.round(box.width)), W - 2);
    const h = Math.min(Math.max(2, Math.round(box.height)), H - 2);
    const x = Math.min(Math.max(0, Math.round(box.x)), W - w);
    const y = Math.min(Math.max(0, Math.round(box.y)), H - h);
    execSync(`ffmpeg -y -i "${webmPath}" -vf "crop=${w}:${h}:${x}:${y},scale=iw*2:ih*2:flags=lanczos" -t 10 -an ${OUT}/how-story-r9-loop.webm`, { stdio: "inherit" });
  }
}

await captureVideo();
await captureDesktop();
await captureMobile();
for (const name of ["how-story-r9-desktop-beat3", "how-story-r9-desktop-beat4", "how-story-r9-mobile"]) {
  execSync(`ffmpeg -y -i ${OUT}/${name}.png ${OUT}/${name}.webp`, { stdio: "ignore" });
}
console.log("done");
