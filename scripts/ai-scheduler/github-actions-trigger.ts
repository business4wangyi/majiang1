#!/usr/bin/env ts-node
/**
 * GitHub Actions AI调度器
 * 
 * 允许AI通过API直接触发GitHub Actions训练任务
 * 支持随时调度，训练结果以AI可读格式输出
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TrainingConfig {
  training_type: 'fast' | 'standard' | 'full';
  iterations?: number;
  selfplay_games?: number;
  mcts_simulations?: number;
}

interface TrainingResult {
  run_id: number;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  workflow_url: string;
  artifacts_url?: string;
  results?: any;
}

/**
 * 通过GitHub CLI触发训练
 */
export async function triggerTraining(config: TrainingConfig): Promise<TrainingResult> {
  const { training_type, iterations, selfplay_games, mcts_simulations } = config;

  console.log(`🚀 AI调度训练任务: ${training_type}`);
  console.log(`配置:`, JSON.stringify(config, null, 2));

  try {
    // 使用GitHub CLI触发工作流
    const inputs: string[] = [`training_type=${training_type}`];
    
    if (iterations) {
      inputs.push(`iterations=${iterations}`);
    }
    if (selfplay_games) {
      inputs.push(`selfplay_games=${selfplay_games}`);
    }
    if (mcts_simulations) {
      inputs.push(`mcts_simulations=${mcts_simulations}`);
    }

    const inputStr = inputs.map(i => `-f "${i}"`).join(' ');
    
    const command = `gh workflow run "AlphaZero Training.yml" ${inputStr}`;
    console.log(`执行命令: ${command}`);
    
    execSync(command, { stdio: 'inherit' });

    // 获取最新的运行ID
    const runInfo = execSync('gh run list --workflow="AlphaZero Training.yml" --limit 1 --json databaseId,status,url', {
      encoding: 'utf-8'
    });
    
    const runs = JSON.parse(runInfo);
    if (runs.length === 0) {
      throw new Error('无法获取运行信息');
    }

    const run = runs[0];
    
    return {
      run_id: run.databaseId,
      status: run.status === 'completed' ? 'completed' : 
              run.status === 'in_progress' ? 'in_progress' : 'queued',
      workflow_url: run.url
    };
  } catch (error: any) {
    console.error('❌ 触发训练失败:', error.message);
    throw error;
  }
}

/**
 * 获取训练结果（AI可读格式）
 */
export async function getTrainingResults(runId: number): Promise<any> {
  try {
    // 获取运行详情
    const runInfo = execSync(`gh run view ${runId} --json conclusion,status,url,artifacts`, {
      encoding: 'utf-8'
    });
    
    const run = JSON.parse(runInfo);
    
    // 获取日志
    const logs = execSync(`gh run view ${runId} --log`, {
      encoding: 'utf-8'
    });

    // 尝试下载artifacts
    let results = null;
    if (run.artifacts && run.artifacts.length > 0) {
      const artifactName = run.artifacts[0].name;
      const downloadDir = path.join(process.cwd(), 'tmp', 'training-results', runId.toString());
      
      execSync(`gh run download ${runId} -n "${artifactName}" -D "${downloadDir}"`, {
        stdio: 'inherit'
      });

      // 查找训练报告JSON文件
      const reportPath = path.join(downloadDir, 'training_report.json');
      if (fs.existsSync(reportPath)) {
        results = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
      }
    }

    return {
      run_id: runId,
      status: run.status,
      conclusion: run.conclusion,
      url: run.url,
      results: results,
      logs: logs.split('\n').slice(-100) // 最后100行日志
    };
  } catch (error: any) {
    console.error('❌ 获取训练结果失败:', error.message);
    throw error;
  }
}

/**
 * 等待训练完成并获取结果
 */
export async function waitForTraining(runId: number, timeoutMinutes: number = 360): Promise<any> {
  const startTime = Date.now();
  const timeout = timeoutMinutes * 60 * 1000;

  console.log(`⏳ 等待训练完成 (Run ID: ${runId})...`);

  while (Date.now() - startTime < timeout) {
    const result = await getTrainingResults(runId);
    
    if (result.status === 'completed' || result.status === 'failed') {
      console.log(`✅ 训练完成: ${result.status}`);
      return result;
    }

    // 每30秒检查一次
    await new Promise(resolve => setTimeout(resolve, 30000));
    process.stdout.write('.');
  }

  throw new Error('训练超时');
}

/**
 * AI调度接口（主函数）
 */
export async function aiScheduleTraining(config: TrainingConfig): Promise<any> {
  console.log('🤖 AI调度训练任务');
  console.log('='.repeat(50));

  // 触发训练
  const triggerResult = await triggerTraining(config);
  console.log(`✅ 训练已触发: Run ID ${triggerResult.run_id}`);
  console.log(`🔗 查看详情: ${triggerResult.workflow_url}`);

  // 等待训练完成
  const finalResult = await waitForTraining(triggerResult.run_id);

  // 返回AI可读格式的结果
  return {
    success: finalResult.conclusion === 'success',
    run_id: finalResult.run_id,
    url: finalResult.url,
    training_results: finalResult.results,
    summary: finalResult.results?.summary || null
  };
}

// CLI接口
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
用法:
  ts-node scripts/ai-scheduler/github-actions-trigger.ts <training_type> [options]

参数:
  training_type: fast | standard | full

示例:
  ts-node scripts/ai-scheduler/github-actions-trigger.ts fast
  ts-node scripts/ai-scheduler/github-actions-trigger.ts standard
  ts-node scripts/ai-scheduler/github-actions-trigger.ts full --iterations 200
    `);
    process.exit(1);
  }

  const trainingType = args[0] as 'fast' | 'standard' | 'full';
  const config: TrainingConfig = { training_type: trainingType };

  // 解析额外参数
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--iterations' && args[i + 1]) {
      config.iterations = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--selfplay-games' && args[i + 1]) {
      config.selfplay_games = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--mcts-simulations' && args[i + 1]) {
      config.mcts_simulations = parseInt(args[i + 1]);
      i++;
    }
  }

  aiScheduleTraining(config)
    .then(result => {
      console.log('\n📊 训练结果 (AI可读格式):');
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 错误:', error.message);
      process.exit(1);
    });
}

