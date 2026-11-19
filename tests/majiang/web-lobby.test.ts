import { expect } from 'chai';
import fs from 'fs';
import path from 'path';

/**
 * 大厅商业启动页 U0（A3+S1）+ 防回退
 * 契约：单主 CTA、只读配置芯片、诊断默认折叠、非三栏仪表盘。
 */
describe('CAP-WEB-LOBBY / MJ-WEB-LOBBY-01 / MJ-LOBBY-U0-01', () => {
  const protoRoot = path.resolve(__dirname, '../../docs/majiang/web-ui-prototype');
  const html = fs.readFileSync(path.join(protoRoot, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(protoRoot, 'styles.css'), 'utf8');
  const appJs = fs.readFileSync(path.join(protoRoot, 'app.js'), 'utf8');

  it('品牌英雄级 + 单主 CTA + 只读配置芯片 id 在场', () => {
    expect(html).to.match(/广东麻将/);
    expect(html).to.match(/一局见真章/);
    expect(html).to.match(/id=["']startGameBtn["']/);
    expect(html).to.match(/开始对局/);
    expect(html).to.match(/id=["']cfgPlayers["']/);
    expect(html).to.match(/id=["']cfgAiType["']/);
    expect(html).to.match(/id=["']cfgRuleSet["']/);
    expect(html).to.match(/id=["']cfgBaseScore["']/);
    expect(html).to.match(/class=["'][^"']*\blobby-config-chips\b/);
    expect(html).to.match(/class=["'][^"']*\blobby-hero\b/);
    expect(html).to.match(/class=["'][^"']*\blobby-drawer\b/);
    expect(html, '禁止多主 CTA 并列').to.not.match(/id=["']startGameBtn["'][\s\S]*id=["']startGameBtn["']/);
  });

  it('诊断/最近对局默认折叠，非常驻三栏仪表盘', () => {
    expect(html).to.match(/id=["']lobbyDiagOutput["']/);
    const diagCollapsed =
      /<details[^>]*id=["']lobbyDiagDetails["'][^>]*>[\s\S]*id=["']lobbyDiagOutput["']/.test(html) ||
      /id=["']lobbyDiagOutput["'][^>]*class=["'][^"']*\bhidden\b/.test(html);
    expect(diagCollapsed, '诊断 JSON 须默认折叠（details 或 .hidden）').to.equal(true);
    expect(html).to.match(/<details[^>]*class=["'][^"']*\blobby-secondary\b/);
    expect(css, '禁止 lobby-cards 三栏主视觉').to.not.match(
      /\.lobby-cards\s*\{[^}]*grid-template-columns:\s*repeat\(\s*3\s*,/
    );
    expect(appJs).to.match(/lobbyDiagnosticsExpanded:\s*false/);
  });

  it('renderLobby 在诊断未展开时不强制倾倒 JSON 到可见区', () => {
    expect(appJs).to.match(/function renderLobby\s*\(/);
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
