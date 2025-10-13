#!/usr/bin/env ts-node

import * as tf from '@tensorflow/tfjs-node';
import { OthelloGame } from './othello-game';
import { RandomStrategy } from './strategy/random-strategy';
import { GreedyStrategy } from './strategy/greedy-strategy';
import { HeuristicStrategy } from './strategy/heuristic-strategy';
import { AlphaZeroStrategy } from './strategy/alphazero-strategy';
import { AlphaZeroNetwork } from './strategy/alphazero-network';

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
    network.model = model;
    
    const alphaZero = new AlphaZeroStrategy(network, {
        simulations: 300,
        explorationWeight: 1.0,
        temperature: 0.1
    });
    
    let wins = 0;
    let draws = 0;
    
    for (let i = 0; i < games; i++) {
        const game = new OthelloGame();
        
        // AlphaZero执黑，对手执白
        while (!game.isGameOver()) {
            if (game.getCurrentPlayer() === 1) {
                // AlphaZero回合
                const move = await alphaZero.getMove(game);
                if (move) {
                    game.makeMove(move.row, move.col);
                }
            } else {
                // 对手回合
                const move = strategy.getMove(game);
                if (move) {
                    game.makeMove(move.row, move.col);
                }
            }
        }
        
        const result = game.getGameResult();
        if (result.winner === 1) {
            wins++;
        } else if (result.winner === 0) {
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
    console.log('=' * 50);
    
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
            new RandomStrategy(), 
            30
        );
        
        // vs贪心策略
        results['贪心策略'] = await testModelVsStrategy(
            model, 
            '贪心策略', 
            new GreedyStrategy(), 
            30
        );
        
        // vs启发式策略
        results['启发式策略'] = await testModelVsStrategy(
            model, 
            '启发式策略', 
            new HeuristicStrategy(), 
            30
        );
        
        // 输出总结
        console.log('\n📊 第14轮模型性能总结');
        console.log('=' * 40);
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