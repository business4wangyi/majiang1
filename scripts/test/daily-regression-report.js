const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');
const reportPath = path.resolve(
  rootDir,
  process.env.REGRESSION_REPORT_PATH || 'logs/daily-regression-report.md',
);
const memoryDir = path.resolve(
  rootDir,
  process.env.REGRESSION_MEMORY_DIR || '.agents/automation-memory/daily-regression',
);
const memoryPath = path.join(memoryDir, 'latest.json');
const dynamicSkipEnabled = (process.env.REGRESSION_DYNAMIC_SKIP || '1') !== '0';

const candidates = [
  {
    command: 'npm test',
    scope: 'Mocha 覆盖 tests/**/*.test.ts，包含麻将核心规则、胡牌牌型、UI 输入、日志以及黑白棋 Edax 解析回归。',
    coverageValue: '高：直接覆盖核心游戏规则和回归测试主体。',
    stability: '高：本地无网络、无密钥依赖，当前可稳定通过。',
    cost: '低：当前约 1 秒内完成，日志较长但可解析统计。',
    dependencyRisk: '低：依赖 npm ci 后的本地 Node 测试环境。',
    priority: '高',
    included: true,
    reason: '核心回归入口，适合每日执行。',
  },
  {
    command: 'npm run build',
    scope: 'TypeScript 全量编译校验。',
    coverageValue: '中：能发现跨模块类型与路径问题。',
    stability: '低：当前仓库存在既有 TS 编译错误，会导致每日任务长期红灯。',
    cost: '中：输出错误较多，排查成本高于单元回归。',
    dependencyRisk: '低：本地编译，无外部服务依赖。',
    priority: '中',
    included: false,
    reason: '暂不纳入每日核心命令；建议在修复既有编译错误后再升级为每日执行项。',
  },
];

const commands = candidates
  .filter((candidate) => candidate.included)
  .map((candidate) => ({
    command: candidate.command,
    scope: candidate.scope,
    kind: candidate.command === 'npm test' ? 'test' : 'check',
  }));

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return {
      readError: error.message,
    };
  }
}

function stripAnsi(value) {
  return value.replace(/\u001b\[[0-9;]*m/g, '').replace(/\r/g, '');
}

function runCommand(command) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn(command, {
      cwd: rootDir,
      shell: true,
      env: {
        ...process.env,
        FORCE_COLOR: process.env.FORCE_COLOR || '0',
      },
    });

    let output = '';

    child.stdout.on('data', (chunk) => {
      process.stdout.write(chunk);
      output += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      process.stderr.write(chunk);
      output += chunk.toString();
    });

    child.on('close', (code, signal) => {
      resolve({
        command,
        exitCode: code == null ? 1 : code,
        signal,
        durationMs: Date.now() - startedAt,
        output: stripAnsi(output),
      });
    });
  });
}

function parseStats(result) {
  const passingMatch = result.output.match(/(\d+)\s+passing(?:\s+\(([^)]+)\))?/);
  const failingMatch = result.output.match(/(\d+)\s+failing/);
  const pendingMatch = result.output.match(/(\d+)\s+pending/);

  if (!passingMatch && !failingMatch && !pendingMatch) {
    return null;
  }

  const passed = passingMatch ? Number(passingMatch[1]) : 0;
  const failed = failingMatch ? Number(failingMatch[1]) : 0;
  const skipped = pendingMatch ? Number(pendingMatch[1]) : 0;
  const total = passed + failed + skipped;

  return {
    total,
    passed,
    failed,
    skipped,
    passRate: total > 0 ? `${((passed / total) * 100).toFixed(2)}%` : '未直接提供',
    reportedDuration: passingMatch && passingMatch[2] ? passingMatch[2] : '未直接提供',
  };
}

function summarizeFailure(result) {
  if (result.exitCode === 0) {
    return null;
  }

  const lines = result.output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const usefulLines = lines.filter((line) => /error|fail|exception|cannot|timeout/i.test(line));
  const excerpt = (usefulLines.length ? usefulLines : lines).slice(-8).join(' ');

  return {
    id: result.command,
    priority: 'P1',
    testName: result.command,
    summary: excerpt || `命令退出码 ${result.exitCode}`,
    suspectedCause: excerpt ? '根据命令输出优先排查最近的错误摘要。' : '证据不足，暂无法判断',
    module: '待确认',
  };
}

function formatDuration(ms) {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  return `${(ms / 1000).toFixed(2)}s`;
}

function markdownTable(headers, rows) {
  const headerLine = `| ${headers.join(' | ')} |`;
  const separatorLine = `| ${headers.map(() => '---').join(' | ')} |`;
  const rowLines = rows.map((row) => `| ${row.map((cell) => String(cell).replace(/\n/g, '<br>')).join(' | ')} |`);
  return [headerLine, separatorLine, ...rowLines].join('\n');
}

function buildTrend(currentFailures, previous) {
  if (!previous || previous.readError) {
    return {
      status: previous && previous.readError ? `历史记录读取失败：${previous.readError}` : '缺少上次基线',
      added: currentFailures.map((failure) => failure.id),
      recovered: [],
      persistent: [],
    };
  }

  const previousFailures = new Set((previous.failures || []).map((failure) => failure.id));
  const currentFailureIds = new Set(currentFailures.map((failure) => failure.id));

  return {
    status: `上次结论：${previous.conclusion || '未直接提供'}`,
    added: currentFailures.map((failure) => failure.id).filter((id) => !previousFailures.has(id)),
    recovered: [...previousFailures].filter((id) => !currentFailureIds.has(id)),
    persistent: currentFailures.map((failure) => failure.id).filter((id) => previousFailures.has(id)),
  };
}

function determineConclusion(results) {
  const successes = results.filter((result) => result.exitCode === 0).length;
  const failures = results.length - successes;

  if (failures === 0) {
    return 'PASS';
  }

  if (successes > 0) {
    return 'PARTIAL';
  }

  return 'FAIL';
}

function getHeadSha() {
  try {
    const git = spawn('git', ['rev-parse', 'HEAD'], {
      cwd: rootDir,
      shell: false,
      env: {
        ...process.env,
      },
    });

    return new Promise((resolve) => {
      let out = '';
      git.stdout.on('data', (chunk) => {
        out += chunk.toString();
      });
      git.on('close', (code) => {
        resolve(code === 0 ? out.trim() : '');
      });
      git.on('error', () => resolve(''));
    });
  } catch (_) {
    return Promise.resolve('');
  }
}

function isWorktreeClean() {
  try {
    const git = spawn('git', ['status', '--porcelain'], {
      cwd: rootDir,
      shell: false,
      env: {
        ...process.env,
      },
    });

    return new Promise((resolve) => {
      let out = '';
      git.stdout.on('data', (chunk) => {
        out += chunk.toString();
      });
      git.on('close', (code) => {
        resolve(code === 0 && out.trim() === '');
      });
      git.on('error', () => resolve(false));
    });
  } catch (_) {
    return Promise.resolve(false);
  }
}

function buildReport(results, previous) {
  const statsByCommand = new Map(results.map((result) => [result.command, parseStats(result)]));
  const failures = results.map(summarizeFailure).filter(Boolean);
  const conclusion = determineConclusion(results);
  const trend = buildTrend(failures, previous);
  const generatedAt = new Date().toISOString();

  const lines = [
    '# Daily Regression Report',
    '',
    `生成时间：${generatedAt}`,
    `工作目录：${rootDir}`,
    '',
    '## 候选测试命令盘点',
    '',
    markdownTable(
      ['命令', '覆盖价值', '稳定性', '成本', '依赖风险', '推荐优先级', '纳入状态'],
      candidates.map((candidate) => [
        `\`${candidate.command}\``,
        candidate.coverageValue,
        candidate.stability,
        candidate.cost,
        candidate.dependencyRisk,
        candidate.priority,
        candidate.included ? `纳入：${candidate.reason}` : `暂不纳入：${candidate.reason}`,
      ]),
    ),
    '',
    '## 最终纳入的每日回归命令集合',
    '',
    markdownTable(
      ['命令', '测试范围', '纳入理由'],
      candidates
        .filter((candidate) => candidate.included)
        .map((candidate) => [`\`${candidate.command}\``, candidate.scope, candidate.reason]),
    ),
    '',
    '### 1. 回归结论',
    '',
    conclusion,
    '',
    '### 2. 测试执行清单',
    '',
    markdownTable(
      ['测试命令', '测试范围', '总耗时', '退出码'],
      results.map((result) => {
        const command = commands.find((item) => item.command === result.command);
        return [`\`${result.command}\``, command ? command.scope : '未直接提供', formatDuration(result.durationMs), result.exitCode];
      }),
    ),
    '',
    '### 3. 结果汇总表',
    '',
    markdownTable(
      ['执行项', '总用例数', '通过数', '失败数', '跳过数', '通过率', '补充结果'],
      results.map((result) => {
        const stats = statsByCommand.get(result.command);
        if (!stats) {
          return [`\`${result.command}\``, '未直接提供', '未直接提供', '未直接提供', '未直接提供', '未直接提供', result.exitCode === 0 ? '执行成功' : '执行失败'];
        }

        return [
          `\`${result.command}\``,
          stats.total,
          stats.passed,
          stats.failed,
          stats.skipped,
          stats.passRate,
          `框架耗时：${stats.reportedDuration}`,
        ];
      }),
    ),
    '',
    '### 4. 失败清单',
    '',
    failures.length
      ? markdownTable(
          ['优先级', '失败测试名', '报错摘要', '疑似根因', '影响模块'],
          failures.map((failure) => [
            failure.priority,
            failure.testName,
            failure.summary,
            failure.suspectedCause,
            failure.module,
          ]),
        )
      : '无',
    '',
    '### 5. 可执行排查步骤',
    '',
    failures.length
      ? failures
          .map(
            (failure) =>
              `- ${failure.id}：先执行 \`${failure.id}\` 复现；预期复现同一错误。若结果不符，检查依赖安装与本地未提交改动后重跑。`,
          )
          .join('\n')
      : '无，本次无需处理。',
    '',
    '### 6. 修复优先级建议',
    '',
    failures.length
      ? failures
          .slice(0, 3)
          .map((failure, index) => `${index + 1}. 先处理 ${failure.id}，因为它属于每日核心回归命令。`)
          .join('\n')
      : '无，本次无需处理。',
    '',
    '### 7. 趋势观察',
    '',
    `- 趋势基线：${trend.status}`,
    `- 新增失败项：${trend.added.length ? trend.added.join(', ') : '无'}`,
    `- 已恢复项：${trend.recovered.length ? trend.recovered.join(', ') : '无'}`,
    `- 持续失败项：${trend.persistent.length ? trend.persistent.join(', ') : '无'}`,
    '',
  ];

  return {
    markdown: lines.join('\n'),
    memory: {
      generatedAt,
      conclusion,
      commands: results.map((result) => ({
        command: result.command,
        exitCode: result.exitCode,
        durationMs: result.durationMs,
        stats: statsByCommand.get(result.command),
      })),
      failures,
    },
    conclusion,
  };
}

function buildSkipReport(previous, headSha) {
  const generatedAt = new Date().toISOString();
  const previousConclusion = previous && !previous.readError ? previous.conclusion || '未直接提供' : '未直接提供';
  const previousHeadSha = previous && !previous.readError ? previous.headSha || '未直接提供' : '未直接提供';

  const lines = [
    '# Daily Regression Report',
    '',
    `生成时间：${generatedAt}`,
    `工作目录：${rootDir}`,
    '',
    '## 候选测试命令盘点',
    '',
    markdownTable(
      ['命令', '覆盖价值', '稳定性', '成本', '依赖风险', '推荐优先级', '纳入状态'],
      candidates.map((candidate) => [
        `\`${candidate.command}\``,
        candidate.coverageValue,
        candidate.stability,
        candidate.cost,
        candidate.dependencyRisk,
        candidate.priority,
        candidate.included ? `纳入：${candidate.reason}` : `暂不纳入：${candidate.reason}`,
      ]),
    ),
    '',
    '## 最终纳入的每日回归命令集合',
    '',
    markdownTable(
      ['命令', '测试范围', '纳入理由'],
      candidates
        .filter((candidate) => candidate.included)
        .map((candidate) => [`\`${candidate.command}\``, candidate.scope, candidate.reason]),
    ),
    '',
    '### 1. 回归结论',
    '',
    'PASS',
    '',
    '### 2. 测试执行清单',
    '',
    markdownTable(
      ['测试命令', '测试范围', '总耗时', '退出码'],
      commands.map((command) => [
        `\`${command.command}\``,
        command.scope,
        '0ms（动态跳过）',
        '未执行（沿用上次 PASS 基线）',
      ]),
    ),
    '',
    '### 3. 结果汇总表',
    '',
    markdownTable(
      ['执行项', '总用例数', '通过数', '失败数', '跳过数', '通过率', '补充结果'],
      commands.map((command) => [
        `\`${command.command}\``,
        '未直接提供',
        '未直接提供',
        '未直接提供',
        '未直接提供',
        '未直接提供',
        '无新提交，沿用上次 PASS 基线跳过执行；本次未重新产出测试统计。',
      ]),
    ),
    '',
    '### 4. 失败清单',
    '',
    '无',
    '',
    '### 5. 可执行排查步骤',
    '',
    '无，本次无需处理。',
    '',
    '### 6. 修复优先级建议',
    '',
    '无，本次无需处理。',
    '',
    '### 7. 趋势观察',
    '',
    `- 趋势基线：上次结论：${previousConclusion}`,
    '- 新增失败项：无',
    '- 已恢复项：无',
    '- 持续失败项：无',
    '- 跳过说明：无新提交，沿用上次 PASS 基线跳过执行。',
    `- 当前 HEAD: ${headSha}`,
    `- 上次 HEAD: ${previousHeadSha}`,
    '- 工作区状态: 干净',
    '',
  ];

  return {
    markdown: lines.join('\n'),
    generatedAt,
  };
}

async function main() {
  const previous = readJson(memoryPath);
  const headSha = await getHeadSha();
  const worktreeClean = await isWorktreeClean();

  const canSkip =
    dynamicSkipEnabled &&
    !!previous &&
    !previous.readError &&
    previous.conclusion === 'PASS' &&
    !!previous.headSha &&
    !!headSha &&
    previous.headSha === headSha &&
    worktreeClean;

  if (canSkip) {
    const skipReport = buildSkipReport(previous, headSha);
    ensureDir(reportPath);
    fs.writeFileSync(reportPath, skipReport.markdown);

    const skipMemory = {
      generatedAt: skipReport.generatedAt,
      conclusion: 'PASS',
      headSha,
      worktreeClean: true,
      skipped: true,
      skipReason: 'NO_NEW_COMMIT_AND_PREVIOUS_PASS',
      commands: [],
      failures: [],
    };
    fs.mkdirSync(memoryDir, { recursive: true });
    fs.writeFileSync(memoryPath, JSON.stringify(skipMemory, null, 2));
    console.log(`\nDaily regression skipped by dynamic sensing. Report written to ${path.relative(rootDir, reportPath)}`);
    console.log(`Daily regression memory written to ${path.relative(rootDir, memoryPath)}`);
    process.exitCode = 0;
    return;
  }

  const results = [];

  for (const item of commands) {
    results.push(await runCommand(item.command));
  }

  const report = buildReport(results, previous);
  ensureDir(reportPath);
  fs.writeFileSync(reportPath, report.markdown);

  console.log(`\nDaily regression report written to ${path.relative(rootDir, reportPath)}`);

  try {
    fs.mkdirSync(memoryDir, { recursive: true });
    fs.writeFileSync(
      memoryPath,
      JSON.stringify(
        {
          ...report.memory,
          headSha,
          worktreeClean,
          skipped: false,
        },
        null,
        2,
      ),
    );
    console.log(`Daily regression memory written to ${path.relative(rootDir, memoryPath)}`);
  } catch (error) {
    console.warn(`Daily regression memory was not written: ${error.message}`);
  }

  process.exitCode = report.conclusion === 'PASS' ? 0 : 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
