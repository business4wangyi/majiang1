#!/usr/bin/env node
/** W8-B 视觉采证（HTTP 静态服 + Playwright 截图）；非功能验收闸门 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const ROOT = path.resolve(__dirname, "..", "..");
const WEB_ROOT = path.join(ROOT, "docs/majiang/web-ui-prototype");
const OUT_DIR = path.join(ROOT, "docs/majiang/design-freeze/stage-b-w8-comp");
const PORT = Number(process.env.MAJIANG_CAPTURE_PORT || 8947);
const CHROME_BIN =
  process.env.MAJIANG_CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TAG = process.env.MAJIANG_CAPTURE_TAG || "2026-11-17-w8-comp-atlas-v2";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const reqPath = decodeURIComponent((req.url || "/").split("?")[0]);
      const safePath = reqPath === "/" ? "/index.html" : reqPath;
      const resolved = path.resolve(WEB_ROOT, `.${safePath}`);
      if (!resolved.startsWith(WEB_ROOT)) {
        res.statusCode = 403;
        res.end("Forbidden");
        return;
      }
      fs.readFile(resolved, (err, data) => {
        if (err) {
          res.statusCode = 404;
          res.end("Not found");
          return;
        }
        res.setHeader("Content-Type", MIME[path.extname(resolved)] || "application/octet-stream");
        res.end(data);
      });
    });
    server.on("error", reject);
    server.listen(PORT, "127.0.0.1", () => resolve(server));
  });
}

async function shot(page, viewport, filename) {
  await page.setViewportSize(viewport);
  await page.goto(`http://127.0.0.1:${PORT}/index.html?acceptance=1`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    if (typeof window.resetMajiangPrototype === "function") window.resetMajiangPrototype();
    if (typeof window.updateMajiangTableViewModel === "function" && window.majiangNextModelExample) {
      window.updateMajiangTableViewModel(window.majiangNextModelExample);
    }
  });
  await page.waitForTimeout(400);
  const atlasCount = await page.locator(".tile-atlas").count();
  const out = path.join(OUT_DIR, filename);
  await page.screenshot({ path: out, fullPage: false });
  return { out, atlasCount };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME_BIN,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage();
  try {
    const desktop = await shot(page, { width: 1440, height: 900 }, `${TAG}-desktop-1440x900.png`);
    const mobile = await shot(page, { width: 390, height: 844 }, `${TAG}-mobile-390x844.png`);
    console.log(JSON.stringify({ desktop, mobile }, null, 2));
    if (desktop.atlasCount < 10) {
      throw new Error(`expected atlas tiles on page, got ${desktop.atlasCount}`);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
