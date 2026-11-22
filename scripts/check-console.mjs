import { chromium } from "playwright";

const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage();
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:3000/#how-it-works", { waitUntil: "networkidle" });
await page.waitForTimeout(4000);
await browser.close();
if (errors.length) {
  console.error(errors);
  process.exit(1);
}
console.log("Console errors: 0");
