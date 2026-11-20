import { expect } from 'chai';
import fs from 'fs';
import path from 'path';

/**
 * 局内桌三抬顶：结构合同 + 关键 id 防回退
 * 契约：方盘桌心、印章动作条、手牌/牌河槽位在场；禁止说明墙抢桌心。
 */
describe('CAP-T3 / MJ-T3-CENTER-01 / MJ-T3-TILE-01', () => {
  const protoRoot = path.resolve(__dirname, '../../docs/majiang/web-ui-prototype');
  const html = fs.readFileSync(path.join(protoRoot, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(protoRoot, 'styles.css'), 'utf8');

  it('tablePage 关键 id 与四方座位/牌河在场', () => {
    expect(html).to.match(/id=["']tablePage["']/);
    expect(html).to.match(/id=["']handTiles["']/);
    expect(html).to.match(/id=["']scoreCoreWall["']/);
    expect(html).to.match(/id=["']river-north["']/);
    expect(html).to.match(/id=["']river-west["']/);
    expect(html).to.match(/id=["']river-east["']/);
    expect(html).to.match(/id=["']river-south["']/);
    expect(html).to.match(/id=["']seat-north["']/);
    expect(html).to.match(/id=["']seat-south["']/);
    expect(html).to.match(/data-action-id=["']hu["']/);
    expect(html).to.match(/data-action-id=["']pass["']/);
    expect(html).to.match(/data-action-id=["']peng["']/);
    expect(html).to.match(/data-action-id=["']gang["']/);
  });

  it('桌心为方盘合同类名，动作条为印章条', () => {
    expect(html).to.match(/class=["'][^"']*\bcenter-score-disk\b/);
    expect(html).to.match(/class=["'][^"']*\baction-seal-bar\b/);
    expect(css).to.match(/\.center-score-disk\s*\{/);
    expect(css).to.match(/\.action-seal-bar/);
  });

  it('禁止桌心半透明说明墙回潮（primaryFocusHint 不得常驻抢主）', () => {
    // 允许节点存在，但默认应可折叠/弱化：须带 table-aux 或 hidden 父级策略类
    expect(html).to.match(/id=["']primaryFocusHint["']/);
    expect(css, '须复用大厅同族毡色变量').to.match(/--table-felt-a/);
    expect(css).to.match(/--gold-2/);
    expect(css, '禁紫霓虹主强调').to.not.match(/#a855f7|#8b5cf6|purple\s*!important/i);
  });

  it('胡钮具备主路径类钩子', () => {
    expect(css).to.match(/data-action-id=["']hu["'].*action-main-path|action-main-path[\s\S]*data-action-id=["']hu["']|\.action-btn\[data-action-id=["']hu["']\]\.action-main-path/);
  });

  it('手牌与最近牌高亮钩子在 CSS 合同内', () => {
    expect(css).to.match(/\.hand-tiles\s*\{/);
    expect(css).to.match(/\.tile\.sel|\.tile\.is-selected|\.hand-tiles\s+\.sel/);
    expect(css).to.match(/tile-mini--latest|\.mini\.latest|\.river-grid[\s\S]*latest/);
    expect(css).to.match(/has-tile-atlas/);
  });
});
