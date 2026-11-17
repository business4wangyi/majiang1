import { expect } from 'chai';
import fs from 'fs';
import path from 'path';

/**
 * CAP-WEB-LOBBY / MJ-WEB-LOBBY-01（为 MJ-ACC-WEB-01 提供大厅开局入口）
 * U0 封顶：一主 CTA + 固定配置摘要；诊断/JSON 默认折叠；非三栏调试仪表盘。
 */
describe('CAP-WEB-LOBBY / MJ-WEB-LOBBY-01', () => {
  const protoRoot = path.resolve(__dirname, '../../docs/majiang/web-ui-prototype');
  const html = fs.readFileSync(path.join(protoRoot, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(protoRoot, 'styles.css'), 'utf8');
  const appJs = fs.readFileSync(path.join(protoRoot, 'app.js'), 'utf8');

  it('大厅主 CTA「开始对局」+ 固定配置摘要在场', () => {
    expect(html).to.match(/id=["']startGameBtn["']/);
    expect(html).to.match(/开始对局/);
    expect(html).to.match(/id=["']cfgPlayers["']/);
    expect(html).to.match(/id=["']cfgAiType["']/);
    expect(html).to.match(/id=["']cfgRuleSet["']/);
    expect(html).to.match(/id=["']cfgBaseScore["']/);
    expect(html).to.match(/当前版本固定配置/);
  });

  it('诊断/JSON 默认折叠，非常驻三栏仪表盘', () => {
    // 诊断区须用 details 折叠，或 output 默认 hidden；禁止三栏 grid 作为大厅主视觉
    expect(html).to.match(/id=["']lobbyDiagOutput["']/);
    const diagCollapsed =
      /<details[^>]*id=["']lobbyDiagDetails["'][^>]*>[\s\S]*id=["']lobbyDiagOutput["']/.test(html) ||
      /id=["']lobbyDiagOutput["'][^>]*class=["'][^"']*\bhidden\b/.test(html);
    expect(diagCollapsed, '诊断 JSON 须默认折叠（details 或 .hidden）').to.equal(true);

    expect(css, '禁止 lobby-cards 三栏主视觉').to.not.match(
      /\.lobby-cards\s*\{[^}]*grid-template-columns:\s*repeat\(\s*3\s*,/
    );
    expect(html).to.match(/class=["'][^"']*\blobby-hero\b/);
    expect(appJs).to.match(/lobbyDiagnosticsExpanded:\s*false/);
  });

  it('renderLobby 在诊断未展开时不强制倾倒 JSON 到可见区', () => {
    expect(appJs).to.match(/function renderLobby\s*\(/);
    // 展开门闩：仅 expanded 时写 lobbyDiagOutput，或写前检查 lobbyDiagnosticsExpanded
    expect(appJs).to.match(/lobbyDiagnosticsExpanded/);
    const alwaysDump =
      /function renderLobby\s*\([^)]*\)\s*\{[\s\S]*?getElementById\(\s*["']lobbyDiagOutput["']\s*\)\.textContent\s*=\s*JSON\.stringify/.test(
        appJs
      ) && !/if\s*\(\s*appState\.lobbyDiagnosticsExpanded\s*\)/.test(appJs);
    expect(alwaysDump, 'renderLobby 不得在诊断折叠时无条件 JSON.stringify 到 lobbyDiagOutput').to.equal(
      false
    );
  });
});
