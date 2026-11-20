'use strict';

/**
 * Web e2e 场景目录（规格 SSOT 的脚本镜像）
 * docs/superpowers/specs/2026-11-18-majiang-web-e2e-catalog-design.md
 * 人读矩阵：docs/standards/testing/majiang-web-e2e-matrix.md
 * 独立回归：npm run regression:web（e2e:full + visual；不并入 daily）
 */
const CASES = [
  { id: 'E01', title: '静态拒开局', tier: 'smoke', runner: 'staticFailClosed', fixture: null },
  { id: 'E02', title: '演示假对局', tier: 'smoke', runner: 'prototypeDemo', fixture: null },
  { id: 'E03', title: '结果四态示意', tier: 'smoke', runner: 'resultExamples', fixture: null },
  { id: 'E04', title: 'API 完局烟雾', tier: 'smoke', runner: 'apiPlayToEnd', fixture: null },
  { id: 'E05', title: '非法出牌', tier: 'smoke', runner: 'illegalDiscard', fixture: null },
  // 说明：E04/E05 现网由 playToEndViaUi 同程覆盖；catalog 分条，runner 可共享实现并去重执行（见 Task 2）
  { id: 'E06', title: '必现碰', tier: 'smoke', runner: 'meldPeng', fixture: 'peng-ready' },
  { id: 'E07', title: '必现吃', tier: 'smoke', runner: 'meldChi', fixture: 'chi-ready' },
  { id: 'E08', title: '点炮胡+分数', tier: 'smoke', runner: 'huReadyScore', fixture: 'hu-ready' },
  { id: 'E09', title: '必现过', tier: 'full', runner: 'passReady', fixture: 'pass-ready' },
  { id: 'E10', title: '必现明杠', tier: 'full', runner: 'gangReady', fixture: 'gang-ready' },
  { id: 'E11', title: '自摸胡+分数', tier: 'full', runner: 'tsumoReady', fixture: 'tsumo-ready' },
  { id: 'E12', title: '真流局', tier: 'full', runner: 'drawReady', fixture: 'draw-ready' },
  { id: 'E13', title: '合法出牌', tier: 'full', runner: 'discardReady', fixture: 'discard-ready' },
  { id: 'E14', title: '非法动作 ID', tier: 'full', runner: 'illegalActionId', fixture: null },
  { id: 'E15', title: '广东术语文案', tier: 'full', runner: 'cantoneseCopy', fixture: null },
  {
    id: 'E16',
    title: '暗杠/补杠',
    tier: 'full',
    runner: 'concealedOrBuGang',
    fixture: 'angang-ready',
  },
  {
    id: 'E17',
    title: '异常终止 abort',
    tier: 'full',
    runner: 'abortTrue',
    fixture: null,
    defer: true,
    deferReason: '真 abort 无 API 入口则保持 defer；E03 示意已覆盖样式',
  },
];

function getE2eCases() {
  return CASES.map((c) => ({ ...c }));
}

function casesForSuite(suite) {
  const all = getE2eCases();
  if (suite === 'smoke') return all.filter((c) => c.tier === 'smoke');
  if (suite === 'full') return all;
  throw new Error(`unknown suite: ${suite}`);
}

module.exports = { getE2eCases, casesForSuite, CASES };
