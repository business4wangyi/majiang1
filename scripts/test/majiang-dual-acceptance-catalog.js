'use strict';

/**
 * 双表面功能验收目录（脚本侧镜像矩阵 SSOT）。
 * 人读 SSOT：docs/product/caps/majiang-dual-surface-acceptance-matrix.md
 * 能力落地后：改对应行 status 为 wired/green，并实现 runner；禁止把 pending 标 green。
 */

const CASES = [
  {
    id: 'MJ-ACC-ENG-01',
    title: '无头 Session 开局→步进→终局',
    tier: 'default',
    capIds: ['CAP-ENG-SESSION'],
    status: 'green',
  },
  {
    id: 'MJ-ACC-SNAP-01',
    title: '快照可喂 view-model；动作来自引擎',
    tier: 'default',
    capIds: ['CAP-ENG-SNAP'],
    status: 'pending',
  },
  {
    id: 'MJ-ACC-CLI-01',
    title: '自动对弈入口走 Session',
    tier: 'default',
    capIds: ['CAP-CLI-TRAIN'],
    status: 'pending',
  },
  {
    id: 'MJ-ACC-CLI-02',
    title: 'N 局统计可重复',
    tier: 'nightly',
    capIds: ['CAP-CLI-TRAIN'],
    status: 'pending',
  },
  {
    id: 'MJ-ACC-API-01',
    title: '对局 API 权威在服务端',
    tier: 'smoke',
    capIds: ['CAP-API-GAME'],
    status: 'pending',
  },
  {
    id: 'MJ-ACC-WEB-01',
    title: '人测主链路完局',
    tier: 'smoke',
    capIds: ['CAP-WEB-BRIDGE', 'CAP-WEB-LOBBY'],
    status: 'pending',
  },
  {
    id: 'MJ-ACC-WEB-02',
    title: '非法动作被拒且不脏写',
    tier: 'smoke',
    capIds: ['CAP-API-GAME', 'CAP-WEB-BRIDGE'],
    status: 'pending',
  },
  {
    id: 'MJ-ACC-DUAL-01',
    title: '双表面同引擎契约可重复',
    tier: 'smoke',
    capIds: ['CAP-ACC-DUAL'],
    status: 'pending',
  },
];

function getAcceptanceCases() {
  return CASES.map((c) => ({ ...c, capIds: c.capIds.slice() }));
}

function casesForTier(tier) {
  return getAcceptanceCases().filter((c) => c.tier === tier);
}

function isRunnable(acceptanceCase) {
  return acceptanceCase.status === 'green' || acceptanceCase.status === 'wired';
}

module.exports = {
  getAcceptanceCases,
  casesForTier,
  isRunnable,
};
