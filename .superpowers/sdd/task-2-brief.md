### Task 2: 阶段 A 自绘冻结 · `MJ-T3-STAGEA-01`

**Files:**
- Create: `docs/majiang/design-freeze/stage-a-v3-table/README.md`
- Create: `docs/majiang/design-freeze/stage-a-v3-table/hifi-table-desktop-1440x900.html`
- Create: `docs/majiang/design-freeze/stage-a-v3-table/2026-11-19-table-desktop-1440x900.png`（截帧产出）
- Modify: `docs/product/spines/majiang-web-table-v3-target.md`（GR-T3 / G-T1 人批后）
- Modify: `docs/product/waves/majiang-web-table-v3-W1.md`
- Modify: `docs/product/caps/majiang-web-table-v3-cap-tasks.md`

**Interfaces:**
- Consumes: 规格 §4–§5；色板 `--table-felt-*` / `--gold-*`
- Produces: 人批冻结的 1440×900 主帧（响应态胡高亮）；方盘桌心合同

- [ ] **Step 1: 写入阶段 A README**

写入 `docs/majiang/design-freeze/stage-a-v3-table/README.md`：

```markdown
# 局内桌三抬顶 · 阶段 A（设计冻结）

> 波次：`docs/product/waves/majiang-web-table-v3-W1.md`  
> 切片：`MJ-T3-STAGEA-01`  
> 目标帧：**仅桌面 1440×900**（移动本波不冻）  
> 人批状态：**待冻结**

## 入库帧

| 视口 | 文件 |
|------|------|
| 桌面 1440×900 | `2026-11-19-table-desktop-1440x900.png` |
| 可截帧源 | `hifi-table-desktop-1440x900.html` |

## 观感合同（自绘 · 方盘桌心）

| 项 | 要求 |
|----|------|
| 构图 | 第一眼锁桌心方盘 + 底部动作/手牌；顶栏次级弱化 |
| 桌心 | **方盘**；风向局 + 余牌可读；禁止半透明说明墙 |
| 动作 | 印章/胶囊条贴手牌上方；**胡最大**且本帧可见高亮 |
| 牌 | 实体感手牌 + 四方牌河；最近一张高亮 |
| 角区 | 头像 + 昵称/风 + 分数胶囊，稀疏 |
| 材质 | 绿毡 + 金强调，与大厅同族；禁紫霓虹 / 平板灰 |
| 竞品 | 只学空间节奏；本 PNG 为自绘交付目标，非竞品截图 |

## 人批栏

- [ ] 人确认本 PNG 为阶段 A 冻结目标（日期：____）
- 未勾选前：禁止宣称视觉通过；实现对照以本帧为准
```

- [ ] **Step 2: 写可截帧高保真 HTML（定稿 1440×900，响应态）**

写入 `docs/majiang/design-freeze/stage-a-v3-table/hifi-table-desktop-1440x900.html`：

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>局内桌阶段A · 1440×900</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 1440px; height: 900px; overflow: hidden; }
    :root {
      --table-felt-a: #128a64;
      --table-felt-b: #0b5c45;
      --table-felt-c: #052e23;
      --gold-1: #f4d68a;
      --gold-2: #d89f40;
      --tile-face-cream: #fffaf0;
      --tile-face-mid: #f3e6cc;
      --tile-face-base: #e5d4b0;
    }
    body {
      color: #ebf3ee;
      font-family: "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif;
      background:
        radial-gradient(ellipse at 50% 42%, rgba(40, 120, 80, 0.55) 0%, transparent 52%),
        linear-gradient(165deg, var(--table-felt-a) 0%, var(--table-felt-b) 45%, var(--table-felt-c) 100%);
    }
    .topbar {
      position: absolute; left: 24px; right: 24px; top: 12px;
      display: flex; gap: 28px; opacity: 0.42; font-size: 13px; letter-spacing: 0.04em;
    }
    .felt {
      position: absolute; inset: 48px 56px 168px;
      border-radius: 28px;
      border: 3px solid rgba(244, 214, 138, 0.22);
      box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.35);
      background:
        radial-gradient(ellipse at 50% 45%, rgba(18, 90, 60, 0.35) 0%, transparent 60%),
        linear-gradient(180deg, rgba(8, 40, 28, 0.2), rgba(4, 22, 16, 0.45));
    }
    .corner {
      position: absolute; display: flex; align-items: center; gap: 10px;
      font-size: 13px;
    }
    .corner .avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(145deg, #2a4a3a, #13261c);
      border: 1px solid rgba(244, 214, 138, 0.35);
    }
    .corner .score {
      padding: 4px 10px; border-radius: 999px;
      background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(244, 214, 138, 0.28);
      color: var(--gold-1); font-variant-numeric: tabular-nums;
    }
    .c-n { left: 50%; top: 18px; transform: translateX(-50%); }
    .c-w { left: 18px; top: 46%; }
    .c-e { right: 18px; top: 46%; }
    .c-s { left: 50%; bottom: 18px; transform: translateX(-50%); }
    .disk {
      position: absolute; left: 50%; top: 46%; transform: translate(-50%, -50%);
      width: 220px; height: 220px; border-radius: 18px;
      background:
        linear-gradient(145deg, rgba(20, 48, 36, 0.95), rgba(8, 24, 18, 0.98));
      border: 2px solid rgba(244, 214, 138, 0.45);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45), inset 0 0 24px rgba(244, 214, 138, 0.08);
      display: grid; place-items: center; text-align: center;
    }
    .disk .round { font-size: 22px; letter-spacing: 0.12em; color: var(--gold-1); }
    .disk .wall { margin-top: 10px; font-size: 15px; opacity: 0.9; }
    .disk .wall strong { color: #fff; font-size: 28px; margin-left: 8px; }
    .river {
      position: absolute; display: flex; gap: 4px; flex-wrap: wrap;
    }
    .r-n { left: 50%; top: 88px; transform: translateX(-50%); width: 280px; justify-content: center; }
    .r-w { left: 72px; top: 38%; width: 120px; }
    .r-e { right: 72px; top: 38%; width: 120px; justify-content: flex-end; }
    .r-s { left: 50%; bottom: 72px; transform: translateX(-50%); width: 320px; justify-content: center; }
    .mini {
      width: 28px; height: 38px; border-radius: 4px;
      background: linear-gradient(180deg, var(--tile-face-cream), var(--tile-face-base));
      border: 1px solid rgba(80, 60, 30, 0.35);
      box-shadow: 1px 2px 0 rgba(40, 90, 60, 0.35);
      color: #1a1208; font-size: 10px; display: grid; place-items: center; font-weight: 700;
    }
    .mini.latest {
      outline: 2px solid var(--gold-2);
      transform: translateY(-3px);
      box-shadow: 0 6px 10px rgba(0, 0, 0, 0.35);
    }
    .bottom {
      position: absolute; left: 0; right: 0; bottom: 0; height: 156px;
      background: linear-gradient(180deg, transparent, rgba(4, 12, 10, 0.72) 28%, rgba(4, 12, 10, 0.92));
      display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
      padding-bottom: 18px; gap: 12px;
    }
    .seals { display: flex; align-items: flex-end; gap: 14px; }
    .seal {
      min-width: 72px; height: 44px; border-radius: 10px;
      border: 1px solid rgba(244, 214, 138, 0.35);
      background: linear-gradient(180deg, #1c3328, #0f1c16);
      color: #e8f2ec; font-size: 16px; font-weight: 700; letter-spacing: 0.12em;
      display: grid; place-items: center;
    }
    .seal.hu {
      min-width: 96px; height: 56px; font-size: 22px;
      background: linear-gradient(180deg, #e2b63a, #b88428);
      color: #1b1306; border-color: #f4d68a;
      box-shadow: 0 8px 18px rgba(216, 159, 64, 0.45);
    }
    .hand { display: flex; gap: 6px; }
    .tile {
      width: 52px; height: 72px; border-radius: 6px;
      background: linear-gradient(180deg, var(--tile-face-cream) 0%, var(--tile-face-mid) 70%, var(--tile-face-base) 100%);
      border: 1px solid rgba(90, 70, 40, 0.4);
      box-shadow: 2px 3px 0 rgba(40, 90, 60, 0.4), 0 8px 14px rgba(0, 0, 0, 0.28);
      color: #1a1208; font-size: 15px; font-weight: 800; display: grid; place-items: center;
    }
    .tile.sel { transform: translateY(-10px); border-color: var(--gold-2); }
    .badge {
      position: absolute; right: 28px; bottom: 170px; font-size: 12px; opacity: 0.5;
    }
  </style>
</head>
<body>
  <header class="topbar">
    <span>局势 · 右家打出三万，你可胡</span>
    <span>余牌 36</span>
    <span>东风局</span>
  </header>
  <div class="felt">
    <div class="corner c-n"><span class="avatar"></span><span>北 · AI-北</span><span class="score">24200</span></div>
    <div class="corner c-w"><span class="avatar"></span><span>西 · AI-西</span><span class="score">21800</span></div>
    <div class="corner c-e"><span class="avatar"></span><span>东 · AI-东</span><span class="score">25600</span></div>
    <div class="corner c-s"><span class="avatar"></span><span>南 · 你</span><span class="score">28400</span></div>
    <div class="river r-n">
      <span class="mini">二万</span><span class="mini">五饼</span><span class="mini">东</span>
    </div>
    <div class="river r-w">
      <span class="mini">三索</span><span class="mini">九万</span>
    </div>
    <div class="river r-e">
      <span class="mini">一饼</span><span class="mini latest">三万</span>
    </div>
    <div class="river r-s">
      <span class="mini">七万</span><span class="mini">八饼</span><span class="mini">中</span>
    </div>
    <div class="disk">
      <div>
        <div class="round">东风局</div>
        <div class="wall">余牌<strong>36</strong></div>
      </div>
    </div>
  </div>
  <div class="bottom">
    <div class="seals">
      <div class="seal hu">胡</div>
      <div class="seal">过</div>
      <div class="seal">碰</div>
      <div class="seal">杠</div>
    </div>
    <div class="hand">
      <span class="tile">一万</span><span class="tile">二万</span><span class="tile sel">三万</span>
      <span class="tile">四万</span><span class="tile">五索</span><span class="tile">六索</span>
      <span class="tile">七饼</span><span class="tile">八饼</span><span class="tile">九饼</span>
      <span class="tile">白</span><span class="tile">发</span><span class="tile">中</span>
      <span class="tile">东</span>
    </div>
  </div>
  <div class="badge">桌面 1440×900 · 方盘 · 响应态</div>
</body>
</html>
```

- [ ] **Step 3: 截帧为 PNG（1440×900）**

在仓库根运行：

```bash
node <<'EOF'
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const file = path.resolve('docs/majiang/design-freeze/stage-a-v3-table/hifi-table-desktop-1440x900.html');
  const out = path.resolve('docs/majiang/design-freeze/stage-a-v3-table/2026-11-19-table-desktop-1440x900.png');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('file://' + file);
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1440, height: 900 } });
  await browser.close();
  console.log('OK: wrote', out);
})().catch((e) => { console.error(e); process.exit(1); });
EOF
file docs/majiang/design-freeze/stage-a-v3-table/2026-11-19-table-desktop-1440x900.png
```

Expected: `OK: wrote ...png`；`file` 报 PNG image。

若 `require('playwright')` 失败：用 Cursor 浏览器打开该 HTML，视口 1440×900 截图后保存到同一路径；**不得**用非 1440×900 糊弄入库；**不得**用 W8/竞品图顶替。

- [ ] **Step 4: 自检合同关键字 + 停等人批**

```bash
rg -q '方盘' docs/majiang/design-freeze/stage-a-v3-table/README.md
rg -q '胡最大' docs/majiang/design-freeze/stage-a-v3-table/README.md
test -f docs/majiang/design-freeze/stage-a-v3-table/2026-11-19-table-desktop-1440x900.png
echo "STOP: 等人批阶段A。聊天确认「批准/冻结」前禁止改原型宣称视觉通过。"
```

**闸门：** 向用户展示 PNG（或路径），索要「批准 / 冻结」。  
**未批准：** 停在本 Task；可改 HTML 重截，不可跳到 Task 3。  
**已批准：** README 人批栏勾选并填日期；脊骨 GR-T3 / G-T1 → 已落地；W1 `MJ-T3-STAGEA-01` → 已落地；`CAP-T3-STAGEA` → 已落地；观感合同改为「阶段 A 已人批」。

- [ ] **Step 5: Commit（仅用户要求且已人批后）**

```bash
git add docs/majiang/design-freeze/stage-a-v3-table \
  docs/product/spines/majiang-web-table-v3-target.md \
  docs/product/waves/majiang-web-table-v3-W1.md \
  docs/product/caps/majiang-web-table-v3-cap-tasks.md
git commit -m "$(cat <<'EOF'
docs(table-v3): 冻结局内桌阶段 A 1440×900 自绘目标

入库方盘桌心+印章动作响应态高保真帧，供阶段 B 对照。
EOF
)"
```

---

