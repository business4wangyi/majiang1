const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const ROOT = path.resolve(__dirname, "..", "..");
const WEB_ROOT = path.join(ROOT, "docs/majiang/web-ui-prototype");
const OUTPUT_DIR = path.join(ROOT, ".tmp/acceptance");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "majiang-webui-acceptance.json");
const EVIDENCE_DIR = path.join(OUTPUT_DIR, "final-evidence");

const DESKTOP_VIEWPORTS = [
  { name: "desktop-1280x900", width: 1280, height: 900 },
  { name: "desktop-1440x900", width: 1440, height: 900 },
];

const MOBILE_VIEWPORTS = [
  { name: "mobile-375x812", width: 375, height: 812 },
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "mobile-414x896", width: 414, height: 896 },
  { name: "mobile-768x1024", width: 768, height: 1024 },
];

const PORT = Number(process.env.MAJIANG_WEB_ACCEPT_PORT || 8940);
const URL = process.env.MAJIANG_WEB_ACCEPT_URL || `http://127.0.0.1:${PORT}/index.html?acceptance=1`;

const CHROME_BIN = process.env.MAJIANG_CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

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
        const ext = path.extname(resolved);
        const mime = ext === ".html"
          ? "text/html; charset=utf-8"
          : ext === ".css"
            ? "text/css; charset=utf-8"
            : ext === ".js"
              ? "application/javascript; charset=utf-8"
              : "text/plain; charset=utf-8";
        res.setHeader("Content-Type", mime);
        res.end(data);
      });
    });
    server.on("error", reject);
    server.listen(PORT, "127.0.0.1", () => resolve(server));
  });
}

async function takeScreenshot(page, viewport, filename) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.locator('body').first().waitFor({ state: 'visible', timeout: 5000 });
  await page.evaluate(() => {
    if (typeof window.resetMajiangPrototype === 'function') {
      window.resetMajiangPrototype();
    }
    if (typeof window.updateMajiangTableViewModel === 'function' && window.majiangNextModelExample) {
      window.updateMajiangTableViewModel(window.majiangNextModelExample);
    }
    if (typeof window.setMajiangActionHandler === 'function' && window.majiangActionHandlerExample) {
      window.setMajiangActionHandler(window.majiangActionHandlerExample);
    }
  });
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, filename),
    fullPage: false,
  });
}

async function runAcceptance() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME_BIN,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  const VIDEO_DIR = path.join(EVIDENCE_DIR, "video");
  fs.mkdirSync(VIDEO_DIR, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: 768, height: 1024 },
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 768, height: 1024 },
    },
  });
  const page = await context.newPage();

  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

  try {
    // 抽屉按钮按设计在窄屏隐藏，焦点验收需使用桌面视口。
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 30000 });

    await page.waitForFunction(() => typeof window.resetMajiangPrototype === "function", 15000);

    // 清空屏幕阅读器内容，确保 showMajiangResultExample 触发新播报
    await page.evaluate(() => {
      const srEl = document.getElementById("screenReaderAnnouncements");
      if (srEl) srEl.textContent = "";
    });

    const result = await page.evaluate(async () => {
      const out = { checks: {}, details: {}, screenshots: {} };
      const byId = (id) => document.getElementById(id);
      const hidden = (id) => byId(id)?.classList.contains("hidden");
      const fire = (key) => window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
      const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      window.resetMajiangPrototype();
      window.updateMajiangTableViewModel(window.majiangWinningModelExample);
      window.setMajiangActionHandler(window.majiangActionHandlerExample);

      fire("ArrowRight");
      fire("ArrowRight");
      const selected = document.querySelectorAll("#handTiles .tile.selected").length;
      const ariaPressed = document.querySelectorAll('#handTiles .tile[aria-pressed="true"]').length;
      out.checks.arrowSelect = selected > 0 && ariaPressed > 0;

      fire("Enter");
      const feedback = byId("feedbackText")?.textContent || "";
      out.checks.enterKey = feedback.length > 0;
      out.details.feedbackAfterEnter = feedback;

      fire("1");
      const srAfterDigit = byId("screenReaderAnnouncements")?.textContent || "";
      out.checks.digitHotkey = srAfterDigit.length > 0;

      // 测试动作说明抽屉：打开 -> 按 Escape 关闭 -> 验证焦点回到触发按钮
      // 注意：openActionExplainDrawerBtn 在宽度>820px时可见，需确保桌面视口
      const drawerBtn = byId("openActionExplainDrawerBtn");
      if (drawerBtn && !drawerBtn.classList.contains("hidden")) {
        drawerBtn.focus(); drawerBtn.click();
        // 等待抽屉打开动画完成
        await wait(200);
      }
      const drawerOpened = !hidden("actionExplainDrawer");
      fire("Escape");
      // 等待 rerender 完成焦点恢复（移动端需要更长时间）
      await wait(500);
      out.checks.drawerEscFocusBack = drawerOpened && hidden("actionExplainDrawer") && document.activeElement === drawerBtn;
      out.details.drawerFocusState = {
        buttonExists: Boolean(drawerBtn),
        buttonHidden: drawerBtn?.classList.contains("hidden"),
        drawerHidden: hidden("actionExplainDrawer"),
        activeElementId: document.activeElement?.id || "",
        viewportWidth: window.innerWidth,
        drawerOpened,
      };

      const preReplayOpenResultBtn = byId("openResult");
      if (preReplayOpenResultBtn) preReplayOpenResultBtn.click();
      const replayBtn = byId("openReplay");
      if (replayBtn) { replayBtn.focus(); replayBtn.click(); }
      const replayOpened = !hidden("replayModal");
      fire("Escape");
      await wait(100);
      out.checks.replayEscFocusBack = replayOpened && hidden("replayModal") && document.activeElement === replayBtn;
      out.details.replayFocusElementId = document.activeElement && document.activeElement.id ? document.activeElement.id : "";

      const resultBtn = byId("openResult");
      if (resultBtn) resultBtn.focus();
      if (resultBtn) resultBtn.click();
      const resultOpened = !hidden("resultModal");
      fire("Escape");
      await wait(100);
      out.checks.resultEscFocusBack = resultOpened && hidden("resultModal") && document.activeElement === resultBtn;

      window.showMajiangResultExample("draw");
      const srAfter = byId("screenReaderAnnouncements")?.textContent || "";
      out.checks.ariaLiveChange = srAfter.length > 0;
      out.details.srAnnouncement = srAfter;

      if (typeof window.triggerMajiangGlobalSyncErrorExample === "function") {
        window.triggerMajiangGlobalSyncErrorExample();
        const globalText = byId("globalSyncErrorText")?.textContent || "";
        out.checks.globalErrorVisible = !hidden("globalSyncError") && globalText.length > 0;
        out.details.globalErrorText = globalText;
      } else {
        out.checks.globalErrorVisible = false;
        out.details.globalErrorText = "triggerMajiangGlobalSyncErrorExample not defined";
      }

      window.showMajiangResultExample("ron");
      const endedButtons = Array.from(document.querySelectorAll(".action-bar [data-action-id]"));
      out.checks.endedDisablesActions = endedButtons.length > 0 && endedButtons.every((button) => button.disabled);
      out.details.endedActionButtonStates = endedButtons.map((button) => ({
        id: button.getAttribute("data-action-id"),
        disabled: button.disabled,
        hidden: button.classList.contains("hidden-by-phase"),
      }));

      const openReplay = byId("openReplay");
      if (openReplay) openReplay.click();
      const keyNode = document.querySelector("#replayTimeline .replay-item.key-node");
      if (keyNode) keyNode.click();
      const replayDetail = byId("replayStateDetail")?.textContent || "";
      out.checks.replayFourSeats = /"north"|北家/.test(replayDetail) && /"west"|西家/.test(replayDetail) && /"east"|东家/.test(replayDetail) && /"south"|南家/.test(replayDetail);
      out.details.replayDetail = replayDetail.slice(0, 160);

      const hasReducedMotion = Array.from(document.styleSheets).some((sheet) => {
        try {
          return Array.from(sheet.cssRules || []).some((rule) => rule.conditionText && rule.conditionText.includes("prefers-reduced-motion"));
        } catch (_) {
          return false;
        }
      });
      out.checks.reducedMotionRule = hasReducedMotion;

      out.summary = {
        passed: Object.values(out.checks).filter(Boolean).length,
        total: Object.keys(out.checks).length,
      };
      return out;
    });

    // 桌面首屏截图（响应窗口冲顶帧）
    for (const vp of DESKTOP_VIEWPORTS) {
      await takeScreenshot(page, vp, `${vp.name}.png`);
    }

    // 移动端同局势帧
    for (const vp of MOBILE_VIEWPORTS) {
      await takeScreenshot(page, vp, `${vp.name}.png`);
    }

    // 四类结果页截图
    const resultTypes = ["tsumo", "ron", "draw", "abort"];
    for (const type of resultTypes) {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.evaluate((t) => {
        if (typeof window.showMajiangResultExample === 'function') {
          window.showMajiangResultExample(t);
        }
      }, type);
      await page.waitForTimeout(200);
      await page.screenshot({
        path: path.join(EVIDENCE_DIR, `result-${type}.png`),
        fullPage: false,
      });
    }

    // 交互录屏（WebM）：使用 Playwright 原生录屏
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.evaluate(() => {
      window.resetMajiangPrototype();
      window.updateMajiangTableViewModel(window.majiangNextModelExample);
      window.setMajiangActionHandler(window.majiangActionHandlerExample);
    });
    await page.waitForTimeout(300);
    await page.locator("#openResult").click().catch(() => {});
    await page.waitForTimeout(250);
    await page.locator("#openReplay").click().catch(() => {});
    await page.waitForTimeout(250);
    await page.locator("#replayTimeline .replay-item.key-node").click().catch(() => {});
    await page.waitForTimeout(250);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    const video = page.video();
    if (video) {
      const sourcePath = await video.path();
      await fs.promises.copyFile(sourcePath, path.join(EVIDENCE_DIR, "interaction-flow.webm"));
      await video.delete().catch(() => {});
    }

    return result;
  } catch (e) {
    console.error("Error in runAcceptance:", e);
    throw e;
  } finally {
    await browser.close();
  }
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const server = await startServer();
  try {
    const result = await runAcceptance();
    fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exit(result.summary.passed === result.summary.total ? 0 : 1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
