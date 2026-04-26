#!/usr/bin/env ts-node

import * as tf from '@tensorflow/tfjs-node';
import { OthelloGame } from '../core/game';
import { RandomOthelloAgent } from '../strategy/agents/random-agent';
import { GreedyOthelloAgent } from '../strategy/agents/greedy-agent';
import { HeuristicOthelloAgent } from '../strategy/agents/heuristic-agent';
import { AlphaZeroOthelloAgent } from '../strategy/agents/alphazero-agent';
import { AlphaZeroNetwork } from '../strategy/networks/alphazero-network';

async function loadModel(modelPath: string): Promise<tf.LayersModel> {
    try {
        console.log(`🔄 加载模型: ${modelPath}`);
        const model = await tf.loadLayersModel(`file://${modelPath}/model.json`);
        console.log(`✅ 模型加载成功`);
        return model;
    } catch (error) {
        console.error(`❌ 模型加载失败:`, error);
        throw error;
    }
}

async function testModelVsStrategy(
    model: tf.LayersModel, 
    strategyName: string, 
    strategy: any, 
    games: number = 30
): Promise<number> {
    console.log(`\n🎯 测试 AlphaZero vs ${strategyName} (${games}局)`);
    
    const network = new AlphaZeroNetwork();
    (network as any).model = model;
    
    const alphaZero = new AlphaZeroOthelloAgent({
        name: 'AlphaZero-PerformanceTest',
        isTraining: false,
        trainingTemperature: 1.0,
        inferenceTemperature: 0.1,
        verbose: false,
        customNetwork: network,
        mctsConfig: {
            numSimulations: 300,
            cPuct: 1.0,
            dirichletAlpha: 0.3,
            noiseWeight: 0.25,
            temperature: 0.1
        }
    });
    
    let wins = 0;
    let draws = 0;
    
    for (let i = 0; i < games; i++) {
        const game = new OthelloGame();
        
        // AlphaZero执黑，对手执白
        while (!game.isGameOver()) {
            if (game.getCurrentPlayer() === 'B') {
                // AlphaZero回合
                const move = alphaZero.chooseAction(game.getBoard(), game.getCurrentPlayer());
                if (move) {
                    game.playAction(move);
                }
            } else {
                // 对手回合
                const move = strategy.chooseAction(game.getBoard(), game.getCurrentPlayer());
                if (move) {
                    game.playAction(move);
                }
            }
        }
        
        const result = game.getResult();
        if (result?.winner === 'B') {
            wins++;
        } else if (result?.winner === 'Draw') {
            draws++;
        }
        
        // 显示进度
        if ((i + 1) % 10 === 0) {
            const currentWinRate = (wins / (i + 1)) * 100;
            console.log(`  进度: ${i + 1}/${games}, 当前胜率: ${currentWinRate.toFixed(1)}%`);
        }
    }
    
    const winRate = (wins / games) * 100;
    const drawRate = (draws / games) * 100;
    
    console.log(`📊 结果: 胜${wins}局 平${draws}局 负${games - wins - draws}局`);
    console.log(`🎯 胜率: ${winRate.toFixed(1)}% (平局率: ${drawRate.toFixed(1)}%)`);
    
    return winRate;
}

async function runModelPerformanceTest() {
    console.log('🚀 AlphaZero模型性能测试');
    console.log('='.repeat(50));
    
    // 模型路径
    const modelPath = '/Users/felixfan/Desktop/AIUse/majiang1/src/othello/training-output/dc-mcp-real-ultra/model-iteration-14';
    
    try {
        // 加载模型
        const model = await loadModel(modelPath);
        
        // 测试vs不同策略
        const results: { [key: string]: number } = {};
        
        // vs随机策略
        results['随机策略'] = await testModelVsStrategy(
            model, 
            '随机策略', 
            new RandomOthelloAgent(),
            30
        );
        
        // vs贪心策略
        results['贪心策略'] = await testModelVsStrategy(
            model, 
            '贪心策略', 
            new GreedyOthelloAgent(),
            30
        );
        
        // vs启发式策略
        results['启发式策略'] = await testModelVsStrategy(
            model, 
            '启发式策略', 
            new HeuristicOthelloAgent(),
            30
        );
        
        // 输出总结
        console.log('\n📊 第14轮模型性能总结');
        console.log('='.repeat(40));
        for (const [strategy, winRate] of Object.entries(results)) {
            const status = winRate >= 50 ? '✅' : winRate >= 30 ? '⚠️' : '❌';
            console.log(`${status} vs ${strategy}: ${winRate.toFixed(1)}%`);
        }
        
        // 计算综合评分
        const avgWinRate = Object.values(results).reduce((a, b) => a + b, 0) / Object.values(results).length;
        console.log(`\n🎯 综合评分: ${avgWinRate.toFixed(1)}%`);
        
        // 评估等级
        let grade = '';
        if (avgWinRate >= 60) grade = 'S级 (专家)';
        else if (avgWinRate >= 50) grade = 'A级 (高级)';
        else if (avgWinRate >= 40) grade = 'B级 (中级)';
        else if (avgWinRate >= 30) grade = 'C级 (初级)';
        else grade = 'D级 (新手)';
        
        console.log(`🏆 模型等级: ${grade}`);
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
}

// 运行测试
if (require.main === module) {
    runModelPerformanceTest().catch(console.error);
}

export { runModelPerformanceTest };
