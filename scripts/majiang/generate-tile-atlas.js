#!/usr/bin/env node
/**
 * Path A：生成自研牌面 PNG 图集（非竞品资产）。
 * 用法：node scripts/majiang/generate-tile-atlas.js
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const ROOT = path.resolve(__dirname, "..", "..");
const OUT_PNG = path.join(ROOT, "docs/majiang/web-ui-prototype/assets/mahjong-tiles-atlas.png");
const OUT_META = path.join(ROOT, "docs/majiang/web-ui-prototype/assets/mahjong-tiles-atlas.json");
const CHROME_BIN =
  process.env.MAJIANG_CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const COLS = 9;
const ROWS = 4;
const CELL_W = 160;
const CELL_H = 214;

const SYMBOLS = [
  ...Array.from({ length: 9 }, (_, i) => `face-dots-${i + 1}`),
  ...Array.from({ length: 9 }, (_, i) => `face-bamboo-${i + 1}`),
  ...Array.from({ length: 9 }, (_, i) => `face-chars-${i + 1}`),
  "face-wind-东",
  "face-wind-南",
  "face-wind-西",
  "face-wind-北",
  "face-dragon-中",
  "face-dragon-发",
  "face-dragon-白",
];

const DOT_CELLS = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
  7: [1, 3, 4, 5, 6, 7, 9],
  8: [1, 2, 3, 4, 6, 7, 8, 9],
  9: [1, 2, 3, 4, 5, 6, 7, 8, 9],
};
const BAMBOO_CELLS = { ...DOT_CELLS };

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME_BIN,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage({
    viewport: { width: COLS * CELL_W, height: ROWS * CELL_H },
  });

  const dataUrl = await page.evaluate(
    ({ cols, rows, cellW, cellH, symbols, dotCells, bambooCells }) => {
      const canvas = document.createElement("canvas");
      canvas.width = cols * cellW;
      canvas.height = rows * cellH;
      const ctx = canvas.getContext("2d");

      function roundRect(x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + w, y, x + w, y + h, rr);
        ctx.arcTo(x + w, y + h, x, y + h, rr);
        ctx.arcTo(x, y + h, x, y, rr);
        ctx.arcTo(x, y, x + w, y, rr);
        ctx.closePath();
      }

      function cellCenter(n, padX, padY, faceW, faceH) {
        const col = ((n - 1) % 3) + 1;
        const row = Math.floor((n - 1) / 3) + 1;
        return {
          x: padX + ((col - 0.5) / 3) * faceW,
          y: padY + ((row - 0.5) / 3) * faceH,
        };
      }

      function drawTileBody(ox, oy) {
        const w = cellW;
        const h = cellH;

        // soft contact shadow
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.beginPath();
        ctx.ellipse(ox + w * 0.5, oy + h - 8, w * 0.38, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // bottom thickness (bone)
        roundRect(ox + 10, oy + 16, w - 16, h - 22, 14);
        const bone = ctx.createLinearGradient(ox, oy + h, ox, oy + h - 30);
        bone.addColorStop(0, "#3a3224");
        bone.addColorStop(0.4, "#6a5a3c");
        bone.addColorStop(1, "#8a7850");
        ctx.fillStyle = bone;
        ctx.fill();

        // right/bottom green plastic shelf
        roundRect(ox + 8, oy + 10, w - 14, h - 24, 13);
        const shelf = ctx.createLinearGradient(ox + w, oy, ox, oy + h);
        shelf.addColorStop(0, "#1a4030");
        shelf.addColorStop(0.35, "#2a6048");
        shelf.addColorStop(0.7, "#3f8a66");
        shelf.addColorStop(1, "#245a42");
        ctx.fillStyle = shelf;
        ctx.fill();

        // left lit green edge strip
        ctx.save();
        roundRect(ox + 8, oy + 10, w - 14, h - 24, 13);
        ctx.clip();
        const leftLit = ctx.createLinearGradient(ox + 8, oy, ox + 28, oy);
        leftLit.addColorStop(0, "rgba(120,210,160,0.55)");
        leftLit.addColorStop(0.55, "rgba(60,140,100,0.2)");
        leftLit.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = leftLit;
        ctx.fillRect(ox + 8, oy + 10, 22, h - 24);
        const rightDim = ctx.createLinearGradient(ox + w - 28, oy, ox + w - 8, oy);
        rightDim.addColorStop(0, "rgba(0,0,0,0)");
        rightDim.addColorStop(1, "rgba(10,30,20,0.45)");
        ctx.fillStyle = rightDim;
        ctx.fillRect(ox + w - 30, oy + 10, 22, h - 24);
        ctx.restore();

        // ivory face
        const fx = ox + 16;
        const fy = oy + 14;
        const fw = w - 36;
        const fh = h - 40;
        roundRect(fx, fy, fw, fh, 10);
        const face = ctx.createLinearGradient(fx, fy, fx + fw * 0.15, fy + fh);
        face.addColorStop(0, "#fffaf0");
        face.addColorStop(0.35, "#f7ebcf");
        face.addColorStop(0.75, "#ead8b4");
        face.addColorStop(1, "#d9c49a");
        ctx.fillStyle = face;
        ctx.fill();

        ctx.save();
        roundRect(fx, fy, fw, fh, 10);
        ctx.clip();

        // ceramic grain（半透明圆点，禁止 putImageData）
        for (let i = 0; i < 420; i += 1) {
          const gx = fx + (Math.sin(i * 12.9898) * 0.5 + 0.5) * fw;
          const gy = fy + (Math.sin(i * 78.233) * 0.5 + 0.5) * fh;
          const a = 0.018 + (i % 5) * 0.004;
          ctx.fillStyle = i % 2 === 0 ? `rgba(110,85,50,${a})` : `rgba(255,255,255,${a + 0.01})`;
          ctx.beginPath();
          ctx.arc(gx, gy, 0.7 + (i % 3) * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }

        // vertical paper fiber
        for (let i = 0; i < fw; i += 4) {
          ctx.fillStyle = i % 8 === 0 ? "rgba(120,95,60,0.04)" : "rgba(255,255,255,0.025)";
          ctx.fillRect(fx + i, fy, 1, fh);
        }

        // vignette / AO at face edge
        const vig = ctx.createRadialGradient(
          fx + fw * 0.45,
          fy + fh * 0.4,
          fw * 0.2,
          fx + fw * 0.5,
          fy + fh * 0.55,
          fw * 0.78
        );
        vig.addColorStop(0, "rgba(0,0,0,0)");
        vig.addColorStop(0.7, "rgba(90,70,40,0.04)");
        vig.addColorStop(1, "rgba(70,50,30,0.18)");
        ctx.fillStyle = vig;
        ctx.fillRect(fx, fy, fw, fh);

        // primary specular streak
        const gloss = ctx.createLinearGradient(fx, fy, fx, fy + fh * 0.42);
        gloss.addColorStop(0, "rgba(255,255,255,0.72)");
        gloss.addColorStop(0.35, "rgba(255,255,255,0.22)");
        gloss.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gloss;
        ctx.fillRect(fx, fy, fw, fh * 0.42);

        // secondary rim light
        const rimLite = ctx.createLinearGradient(fx, fy, fx + fw, fy);
        rimLite.addColorStop(0, "rgba(255,255,255,0.28)");
        rimLite.addColorStop(0.2, "rgba(255,255,255,0)");
        rimLite.addColorStop(0.85, "rgba(255,255,255,0)");
        rimLite.addColorStop(1, "rgba(255,240,210,0.12)");
        ctx.fillStyle = rimLite;
        ctx.fillRect(fx, fy, fw, fh * 0.55);

        // bottom face warm shadow (thickness read)
        const bot = ctx.createLinearGradient(fx, fy + fh * 0.65, fx, fy + fh);
        bot.addColorStop(0, "rgba(0,0,0,0)");
        bot.addColorStop(1, "rgba(90,70,40,0.22)");
        ctx.fillStyle = bot;
        ctx.fillRect(fx, fy + fh * 0.55, fw, fh * 0.45);
        ctx.restore();

        // inner bevel ring
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth = 2;
        roundRect(fx + 2, fy + 2, fw - 4, fh - 4, 8);
        ctx.stroke();
        ctx.strokeStyle = "rgba(100,80,50,0.35)";
        ctx.lineWidth = 1.2;
        roundRect(fx + 0.8, fy + 0.8, fw - 1.6, fh - 1.6, 9);
        ctx.stroke();

        // green plastic peek on left of face
        ctx.fillStyle = "rgba(50,120,85,0.35)";
        ctx.fillRect(fx - 3, fy + 4, 3.5, fh - 8);

        return { fx, fy, fw, fh };
      }

      function drawDot(cx, cy, color) {
        const r = 12.5;
        // soft ink shadow
        ctx.beginPath();
        ctx.arc(cx + 1.2, cy + 1.8, r + 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(40,30,20,0.22)";
        ctx.fill();

        // enamel body
        const g = ctx.createRadialGradient(cx - 3, cy - 4, 1.5, cx, cy, r);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.18, color);
        g.addColorStop(0.72, color);
        g.addColorStop(1, "#142030");
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        // outer ring
        ctx.beginPath();
        ctx.arc(cx, cy, r - 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(20,30,40,0.35)";
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // inner decorative ring
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // specular
        ctx.beginPath();
        ctx.ellipse(cx - 3.2, cy - 4, 3.2, 2.2, -0.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fill();
      }

      function dotColor(n, rank) {
        if (rank === 1) return "#2f6fb8";
        if (n === 5) return "#d6453a";
        if (rank === 3 && n === 5) return "#d6453a";
        if (rank === 6 && (n === 4 || n === 6)) return "#2f6fb8";
        if (rank === 7 && (n === 4 || n === 6)) return "#2f6fb8";
        if (rank === 7 && n === 5) return "#d6453a";
        if (rank === 8 && (n === 2 || n === 8)) return "#2f6fb8";
        if (rank === 9 && n === 5) return "#d6453a";
        if (rank === 9 && (n === 2 || n === 8)) return "#2f6fb8";
        if (rank >= 8 && (n === 2 || n === 8)) return "#2f6fb8";
        return "#2f9a58";
      }

      function drawBamboo(cx, cy, tall) {
        const bw = tall ? 16 : 11;
        const bh = tall ? 38 : 24;
        const x = cx - bw / 2;
        const y = cy - bh / 2;

        ctx.beginPath();
        ctx.ellipse(cx + 1, cy + bh * 0.42, bw * 0.55, 3, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(20,40,20,0.2)";
        ctx.fill();

        const g = ctx.createLinearGradient(x, y, x + bw, y);
        g.addColorStop(0, "#7ee0a0");
        g.addColorStop(0.35, "#2f9a58");
        g.addColorStop(0.55, "#1f7a42");
        g.addColorStop(0.75, "#3cb86a");
        g.addColorStop(1, "#145530");
        roundRect(x, y, bw, bh, bw / 2);
        ctx.fillStyle = g;
        ctx.fill();

        // nodes
        [0.28, 0.55].forEach((t) => {
          roundRect(x + bw * 0.12, y + bh * t, bw * 0.76, 2.6, 1.2);
          ctx.fillStyle = "rgba(12,60,30,0.62)";
          ctx.fill();
          ctx.fillStyle = "rgba(180,255,200,0.25)";
          ctx.fillRect(x + bw * 0.18, y + bh * t, bw * 0.55, 1);
        });

        // highlight stripe
        ctx.fillStyle = "rgba(255,255,255,0.28)";
        roundRect(x + bw * 0.18, y + 3, bw * 0.22, bh - 6, bw * 0.1);
        ctx.fill();

        // leaf
        ctx.beginPath();
        ctx.ellipse(cx + bw * 0.35, y + 1, 5.5, 2.6, -0.55, 0, Math.PI * 2);
        ctx.fillStyle = "#3cb86a";
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx - bw * 0.2, y + 2, 4, 2, 0.4, 0, Math.PI * 2);
        ctx.fillStyle = "#1f7a42";
        ctx.fill();
      }

      function drawText(cx, cy, text, color, size) {
        ctx.save();
        ctx.font = `800 ${size}px "Songti SC","STSong","Noto Serif CJK SC","PingFang SC",serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineJoin = "round";
        ctx.miterLimit = 2;

        // carved shadow
        ctx.strokeStyle = "rgba(40,25,15,0.35)";
        ctx.lineWidth = size * 0.12;
        ctx.strokeText(text, cx + 1.4, cy + 2);
        ctx.fillStyle = "rgba(40,25,15,0.18)";
        ctx.fillText(text, cx + 1.2, cy + 1.8);

        // ink body
        ctx.strokeStyle = "rgba(20,15,10,0.55)";
        ctx.lineWidth = size * 0.06;
        ctx.strokeText(text, cx, cy);
        ctx.fillStyle = color;
        ctx.fillText(text, cx, cy);

        // emboss highlight
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = "#fff8e8";
        ctx.fillText(text, cx - 1, cy - 1.2);
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      function paintSymbol(symbol, ox, oy) {
        const { fx, fy, fw, fh } = drawTileBody(ox, oy);
        const padX = fx + fw * 0.1;
        const padY = fy + fh * 0.1;
        const faceW = fw * 0.8;
        const faceH = fh * 0.8;

        if (symbol.startsWith("face-dots-")) {
          const rank = Number(symbol.split("-").pop());
          for (const n of dotCells[rank]) {
            const { x, y } = cellCenter(n, padX, padY, faceW, faceH);
            drawDot(x, y, dotColor(n, rank));
          }
          return;
        }
        if (symbol.startsWith("face-bamboo-")) {
          const rank = Number(symbol.split("-").pop());
          for (const n of bambooCells[rank]) {
            const { x, y } = cellCenter(n, padX, padY, faceW, faceH);
            drawBamboo(x, y, rank === 1 && n === 5);
          }
          return;
        }
        if (symbol.startsWith("face-chars-")) {
          const rank = Number(symbol.split("-").pop());
          const rankMap = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
          drawText(fx + fw / 2, fy + fh * 0.36, rankMap[rank], "#2c1c12", 46);
          drawText(fx + fw / 2, fy + fh * 0.72, "萬", "#b81f1f", 32);
          return;
        }
        if (symbol.startsWith("face-wind-")) {
          drawText(fx + fw / 2, fy + fh / 2, symbol.slice("face-wind-".length), "#16140f", 62);
          return;
        }
        if (symbol === "face-dragon-中") {
          drawText(fx + fw / 2, fy + fh / 2, "中", "#b01f1a", 62);
          return;
        }
        if (symbol === "face-dragon-发") {
          drawText(fx + fw / 2, fy + fh / 2, "发", "#176338", 62);
          return;
        }
        if (symbol === "face-dragon-白") {
          ctx.save();
          ctx.shadowColor = "rgba(40,30,20,0.25)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetY = 2;
          ctx.strokeStyle = "#2a3436";
          ctx.lineWidth = 7;
          roundRect(fx + fw * 0.2, fy + fh * 0.16, fw * 0.6, fh * 0.68, 7);
          ctx.stroke();
          ctx.shadowColor = "transparent";
          ctx.strokeStyle = "rgba(255,255,255,0.35)";
          ctx.lineWidth = 2;
          roundRect(fx + fw * 0.2 + 3, fy + fh * 0.16 + 3, fw * 0.6 - 6, fh * 0.68 - 6, 5);
          ctx.stroke();
          ctx.restore();
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      symbols.forEach((symbol, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        paintSymbol(symbol, col * cellW, row * cellH);
      });
      return canvas.toDataURL("image/png");
    },
    {
      cols: COLS,
      rows: ROWS,
      cellW: CELL_W,
      cellH: CELL_H,
      symbols: SYMBOLS,
      dotCells: DOT_CELLS,
      bambooCells: BAMBOO_CELLS,
    }
  );

  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  fs.mkdirSync(path.dirname(OUT_PNG), { recursive: true });
  fs.writeFileSync(OUT_PNG, Buffer.from(base64, "base64"));

  const index = {};
  SYMBOLS.forEach((symbol, i) => {
    index[symbol] = { col: i % COLS, row: Math.floor(i / COLS) };
  });
  fs.writeFileSync(
    OUT_META,
    JSON.stringify(
      {
        cols: COLS,
        rows: ROWS,
        cellW: CELL_W,
        cellH: CELL_H,
        image: "mahjong-tiles-atlas.png",
        symbols: index,
        note: "自研程序绘制 v2 质感加强；非竞品资产拷贝",
        version: 2,
      },
      null,
      2
    )
  );

  await browser.close();
  console.log(`wrote ${OUT_PNG} (${fs.statSync(OUT_PNG).size} bytes)`);
  console.log(`wrote ${OUT_META}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
