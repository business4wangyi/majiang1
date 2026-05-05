const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const ROOT = path.resolve(__dirname, "..", "..");
const WEB_ROOT = path.join(ROOT, "docs/majiang/web-ui-prototype");
const OUTPUT_DIR = path.join(ROOT, ".tmp/acceptance");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "majiang-webui-acceptance.json");
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

async function runAcceptance() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME_BIN,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: 768, height: 1024 } });
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 30000 });

  const result = await page.evaluate(() => {
    const out = { checks: {}, details: {} };
    const byId = (id) => document.getElementById(id);
    const hidden = (id) => byId(id)?.classList.contains("hidden");
    const fire = (key) => window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));

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

    const drawerBtn = byId("openActionExplainDrawerBtn");
    drawerBtn?.focus();
    drawerBtn?.click();
    const drawerOpened = !hidden("actionExplainDrawer");
    fire("Escape");
    out.checks.drawerEscFocusBack = drawerOpened && hidden("actionExplainDrawer") && document.activeElement === drawerBtn;

    const preReplayOpenResultBtn = byId("openResult");
    preReplayOpenResultBtn?.click();
    const replayBtn = byId("openReplay");
    replayBtn?.focus();
    replayBtn?.click();
    const replayOpened = !hidden("replayModal");
    fire("Escape");
    out.checks.replayEscFocusBack = replayOpened && hidden("replayModal") && document.activeElement === replayBtn;
    out.details.replayFocusElementId = document.activeElement && document.activeElement.id ? document.activeElement.id : "";

    const resultBtn = byId("openResult");
    resultBtn?.focus();
    resultBtn?.click();
    const resultOpened = !hidden("resultModal");
    fire("Escape");
    out.checks.resultEscFocusBack = resultOpened && hidden("resultModal") && document.activeElement === resultBtn;

    const srBefore = byId("screenReaderAnnouncements")?.textContent || "";
    window.showMajiangResultExample("draw");
    const srAfter = byId("screenReaderAnnouncements")?.textContent || "";
    out.checks.ariaLiveChange = srAfter.length > 0 && srAfter !== srBefore;
    out.details.srAnnouncement = srAfter;

    window.triggerMajiangGlobalSyncErrorExample();
    const globalText = byId("globalSyncErrorText")?.textContent || "";
    out.checks.globalErrorVisible = !hidden("globalSyncError") && globalText.length > 0;
    out.details.globalErrorText = globalText;

    window.showMajiangResultExample("ron");
    const endedButtons = Array.from(document.querySelectorAll(".action-bar [data-action-id]"));
    out.checks.endedDisablesActions = endedButtons.length > 0 && endedButtons.every((button) => button.disabled);
    out.details.endedActionButtonStates = endedButtons.map((button) => ({
      id: button.getAttribute("data-action-id"),
      disabled: button.disabled,
      hidden: button.classList.contains("hidden-by-phase"),
    }));

    const openReplay = byId("openReplay");
    openReplay?.click();
    const keyNode = document.querySelector("#replayTimeline .replay-item.key-node");
    keyNode?.click();
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

  await browser.close();
  return result;
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
