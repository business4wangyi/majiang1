'use strict';

/**
 * Web 独立回归（不并入 regression:daily）
 * 顺序：e2e full → visual（阶段 B 金标防回退）
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, '.tmp', 'acceptance');
const OUT_FILE = path.join(OUT_DIR, 'majiang-web-regression.json');

function runStep(name, command, env = {}) {
  console.log(`\n[regression:web] ▶ ${name}`);
  const result = spawnSync(command, {
    cwd: ROOT,
    env: { ...process.env, ...env },
    shell: true,
    encoding: 'utf8',
    stdio: 'inherit',
  });
  return {
    name,
    status: result.status === 0 ? 'pass' : 'fail',
    exitCode: result.status == null ? 1 : result.status,
  };
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const steps = [];
  steps.push(
    runStep('e2e:full', 'npm run majiang:web:e2e:full', {
      MAJIANG_E2E_SUITE: 'full',
    })
  );
  // e2e 失败仍跑 visual，便于一次看清两端结果
  steps.push(runStep('visual', 'npm run majiang:web:visual'));

  const report = {
    generatedAt: new Date().toISOString(),
    steps,
    pass: steps.filter((s) => s.status === 'pass').length,
    fail: steps.filter((s) => s.status === 'fail').length,
    note: '功能/e2e/visual 绿 ≠ 视觉冲顶毕业；金标为阶段 B 实现帧',
  };
  fs.writeFileSync(OUT_FILE, JSON.stringify(report, null, 2));
  console.log(
    `\n[regression:web] pass=${report.pass} fail=${report.fail} report=${OUT_FILE}`
  );
  if (report.fail > 0) process.exitCode = 1;
}

main();
