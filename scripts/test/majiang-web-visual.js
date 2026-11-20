'use strict';

/**
 * Web 视觉防回退（金标 = 阶段 B 实现帧，非视觉冲顶毕业）
 * - 大厅 / 局内桌 · 1440×900
 * - 像素差超阈值失败；MAJIANG_VISUAL_UPDATE=1 可重写金标
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..', '..');
const WEB_ROOT = path.join(ROOT, 'docs/majiang/web-ui-prototype');
const OUT_DIR = path.join(ROOT, '.tmp', 'acceptance', 'visual');
const OUT_FILE = path.join(OUT_DIR, 'majiang-web-visual.json');
const CHROME_BIN =
  process.env.MAJIANG_CHROME_BIN ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const VIEWPORT = { width: 1440, height: 900 };
/** 通道差 > 此值视为像素不同 */
const CHANNEL_TOLERANCE = Number(process.env.MAJIANG_VISUAL_CHANNEL_TOL || 12);
/** 不同像素占比上限（0.002 = 0.2%） */
const MAX_DIFF_RATIO = Number(process.env.MAJIANG_VISUAL_MAX_DIFF || 0.002);
const UPDATE = process.env.MAJIANG_VISUAL_UPDATE === '1';

const FRAMES = [
  {
    id: 'lobby',
    title: '大厅商业启动页',
    baseline: path.join(
      ROOT,
      'docs/majiang/design-freeze/stage-b-lobby-commercial/2026-11-19-lobby-impl-desktop-1440x900.png'
    ),
    async prepare(page, baseUrl) {
      await page.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForFunction(() => typeof window.resetMajiangPrototype === 'function', null, {
        timeout: 15000,
      });
      await page.evaluate(() => {
        if (typeof window.resetMajiangPrototype === 'function') window.resetMajiangPrototype();
      });
      await page.waitForSelector('#lobbyPage:not(.hidden)', { timeout: 10000 });
    },
  },
  {
    id: 'table',
    title: '局内桌响应态（可胡）',
    baseline: path.join(
      ROOT,
      'docs/majiang/design-freeze/stage-b-v3-table/2026-11-19-table-impl-desktop-1440x900.png'
    ),
    async prepare(page, baseUrl) {
      await page.goto(`${baseUrl}/index.html?acceptance=1`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await page.waitForFunction(() => typeof window.resetMajiangPrototype === 'function', null, {
        timeout: 15000,
      });
      // 原型 load 时 startCountdown() 每 200ms 改 remainingMs 并 rerender → 截图像素漂移
      await page.evaluate(() => {
        const probe = setInterval(() => {}, 1e6);
        for (let i = 1; i <= probe; i += 1) clearInterval(i);
      });
      await page.evaluate(() => {
        if (typeof window.resetMajiangPrototype === 'function') window.resetMajiangPrototype();
        // reset 可能再次挂上 timer：再清一次
        const probe = setInterval(() => {}, 1e6);
        for (let i = 1; i <= probe; i += 1) clearInterval(i);
        if (
          typeof window.updateMajiangTableViewModel === 'function' &&
          window.majiangNextModelExample
        ) {
          const base = window.majiangNextModelExample;
          window.updateMajiangTableViewModel({
            ...base,
            responseContext: {
              ...(base.responseContext || {}),
              remainingMs: 6000,
            },
          });
        }
      });
      await page.waitForSelector('#tablePage:not(.hidden)', { timeout: 10000 });
    },
  },
];

function startStatic() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const reqPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const safePath = reqPath === '/' ? '/index.html' : reqPath;
      const resolved = path.resolve(WEB_ROOT, `.${safePath}`);
      if (!resolved.startsWith(WEB_ROOT)) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
      }
      fs.readFile(resolved, (err, data) => {
        if (err) {
          res.statusCode = 404;
          res.end('Not found');
          return;
        }
        const ext = path.extname(resolved);
        const mime =
          ext === '.html'
            ? 'text/html; charset=utf-8'
            : ext === '.css'
              ? 'text/css; charset=utf-8'
              : ext === '.js'
                ? 'application/javascript; charset=utf-8'
                : 'text/plain; charset=utf-8';
        res.setHeader('Content-Type', mime);
        res.end(data);
      });
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve()))
  );
}

async function stabilize(page) {
  await page.addStyleTag({
    content:
      '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;}',
  });
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
  });
  await page.waitForTimeout(200);
}

/**
 * 用浏览器解码 PNG 并算差异（无额外 npm 依赖）
 */
async function diffInBrowser(page, baselinePath, actualPath, diffPath) {
  const baselineB64 = fs.readFileSync(baselinePath).toString('base64');
  const actualB64 = fs.readFileSync(actualPath).toString('base64');
  const result = await page.evaluate(
    async ({ baselineB64, actualB64, channelTol }) => {
      function load(b64) {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('image decode failed'));
          img.src = 'data:image/png;base64,' + b64;
        });
      }
      const a = await load(baselineB64);
      const b = await load(actualB64);
      if (a.width !== b.width || a.height !== b.height) {
        return {
          ok: false,
          error: `size mismatch baseline=${a.width}x${a.height} actual=${b.width}x${b.height}`,
          width: a.width,
          height: a.height,
          diffPixels: -1,
          totalPixels: a.width * a.height,
          diffRatio: 1,
          diffPngBase64: null,
        };
      }
      const w = a.width;
      const h = a.height;
      const c1 = document.createElement('canvas');
      const c2 = document.createElement('canvas');
      const cd = document.createElement('canvas');
      c1.width = c2.width = cd.width = w;
      c1.height = c2.height = cd.height = h;
      const x1 = c1.getContext('2d', { willReadFrequently: true });
      const x2 = c2.getContext('2d', { willReadFrequently: true });
      const xd = cd.getContext('2d');
      x1.drawImage(a, 0, 0);
      x2.drawImage(b, 0, 0);
      const d1 = x1.getImageData(0, 0, w, h).data;
      const d2 = x2.getImageData(0, 0, w, h).data;
      const out = xd.createImageData(w, h);
      let diffPixels = 0;
      for (let i = 0; i < d1.length; i += 4) {
        const dr = Math.abs(d1[i] - d2[i]);
        const dg = Math.abs(d1[i + 1] - d2[i + 1]);
        const db = Math.abs(d1[i + 2] - d2[i + 2]);
        if (dr > channelTol || dg > channelTol || db > channelTol) {
          diffPixels += 1;
          out.data[i] = 255;
          out.data[i + 1] = 0;
          out.data[i + 2] = 0;
          out.data[i + 3] = 255;
        } else {
          const g = Math.round((d2[i] + d2[i + 1] + d2[i + 2]) / 3);
          out.data[i] = g;
          out.data[i + 1] = g;
          out.data[i + 2] = g;
          out.data[i + 3] = 255;
        }
      }
      xd.putImageData(out, 0, 0);
      const totalPixels = w * h;
      return {
        ok: true,
        width: w,
        height: h,
        diffPixels,
        totalPixels,
        diffRatio: diffPixels / totalPixels,
        diffPngBase64: cd.toDataURL('image/png').slice('data:image/png;base64,'.length),
      };
    },
    { baselineB64, actualB64, channelTol: CHANNEL_TOLERANCE }
  );

  if (result.diffPngBase64) {
    fs.writeFileSync(diffPath, Buffer.from(result.diffPngBase64, 'base64'));
  }
  return result;
}

async function run() {
  if (!fs.existsSync(CHROME_BIN)) {
    throw new Error(`Chrome not found at ${CHROME_BIN}; set MAJIANG_CHROME_BIN`);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const server = await startStatic();
  const addr = server.address();
  const baseUrl = `http://127.0.0.1:${addr.port}`;
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME_BIN,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  const report = {
    gold: 'stage-b-impl',
    viewport: VIEWPORT,
    channelTolerance: CHANNEL_TOLERANCE,
    maxDiffRatio: MAX_DIFF_RATIO,
    update: UPDATE,
    frames: [],
    pass: 0,
    fail: 0,
  };

  try {
    const page = await browser.newPage({ viewport: VIEWPORT });
    page.setDefaultTimeout(60000);

    for (const frame of FRAMES) {
      const entry = { id: frame.id, title: frame.title, status: 'fail' };
      const actualPath = path.join(OUT_DIR, `${frame.id}-actual-1440x900.png`);
      const diffPath = path.join(OUT_DIR, `${frame.id}-diff-1440x900.png`);

      try {
        if (!fs.existsSync(frame.baseline) && !UPDATE) {
          throw new Error(`missing baseline: ${frame.baseline}`);
        }

        await frame.prepare(page, baseUrl);
        await stabilize(page);
        await page.screenshot({
          path: actualPath,
          clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
          animations: 'disabled',
        });

        if (UPDATE || !fs.existsSync(frame.baseline)) {
          fs.mkdirSync(path.dirname(frame.baseline), { recursive: true });
          fs.copyFileSync(actualPath, frame.baseline);
          entry.status = 'updated';
          entry.baseline = frame.baseline;
          entry.actual = actualPath;
          report.pass += 1;
          report.frames.push(entry);
          console.log(`[visual] ${frame.id}: updated baseline`);
          continue;
        }

        const diff = await diffInBrowser(page, frame.baseline, actualPath, diffPath);
        entry.baseline = frame.baseline;
        entry.actual = actualPath;
        entry.diff = diffPath;
        entry.diffPixels = diff.diffPixels;
        entry.diffRatio = diff.diffRatio;
        if (diff.error) {
          entry.error = diff.error;
          entry.status = 'fail';
          report.fail += 1;
        } else if (diff.diffRatio > MAX_DIFF_RATIO) {
          entry.error = `diffRatio ${(diff.diffRatio * 100).toFixed(3)}% > ${(MAX_DIFF_RATIO * 100).toFixed(3)}%`;
          entry.status = 'fail';
          report.fail += 1;
        } else {
          entry.status = 'pass';
          report.pass += 1;
        }
        console.log(
          `[visual] ${frame.id}: ${entry.status}` +
            (entry.diffRatio != null ? ` diff=${(entry.diffRatio * 100).toFixed(3)}%` : '') +
            (entry.error ? ` (${entry.error})` : '')
        );
      } catch (err) {
        entry.status = 'fail';
        entry.error = err && err.message ? err.message : String(err);
        report.fail += 1;
        console.error(`[visual] ${frame.id}: fail (${entry.error})`);
      }
      report.frames.push(entry);
    }
  } finally {
    await browser.close();
    await closeServer(server);
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(report, null, 2));
  console.log(`[visual] pass=${report.pass} fail=${report.fail} report=${OUT_FILE}`);
  console.log('[visual] note: pass ≠ 视觉冲顶毕业；金标为阶段 B 实现帧');
  if (report.fail > 0) process.exitCode = 1;
}

run().catch((err) => {
  console.error('[visual] fatal:', err);
  process.exitCode = 1;
});
