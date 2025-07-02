/**
 * AI辅助系统使用示例
 * 展示如何在不同场景下使用AI辅助功能
 */

import { AIGameAssistant, AIAssistantConfig } from './main-controller';
import { MobileAIAssistant, MobileConfig } from './mobile-app';
import { StrategyLevel } from '../strategy-simplifier';

/**
 * 示例1：桌面端屏幕识别AI辅助
 * 适用于在线游戏网站的AI辅助
 */
export async function desktopScreenAssistantExample(): Promise<void> {
  console.log('=== 桌面端屏幕识别AI辅助示例 ===');
  
  const config: AIAssistantConfig = {
    recognition: {
      source: 'screen',
      gameRegion: { x: 100, y: 100, width: 300, height: 300 }, // 游戏区域坐标
      confidence: 0.8
    },
    ai: {
      strategy: 'minimax',
      difficulty: 'hard',
      timeLimit: 2000,
      explainDecisions: true
    },
    output: {
      mode: 'suggest', // 仅建议，不自动执行
      showAlternatives: true,
      voiceEnabled: true,
      language: 'zh-CN'
    },
    strategy: {
      level: StrategyLevel.INTERMEDIATE,
      showExplanations: true,
      enableLearning: true
    }
  };

  const assistant = new AIGameAssistant(config);
  
  try {
    await assistant.start();
    console.log('AI辅助系统已启动，正在监控屏幕游戏状态...');
    
    // 运行5分钟后自动停止
    setTimeout(async () => {
      await assistant.stop();
      console.log('AI辅助系统已停止');
      
      // 获取学习建议
      const learningAdvice = assistant.getLearningAdvice();
      if (learningAdvice) {
        console.log('学习建议:', learningAdvice);
      }
    }, 5 * 60 * 1000);
    
  } catch (error) {
    console.error('启动失败:', error);
  }
}

/**
 * 示例2：摄像头物理棋盘识别
 * 适用于识别真实的纸质棋盘或实体棋子
 */
export async function cameraPhysicalBoardExample(): Promise<void> {
  console.log('=== 摄像头物理棋盘识别示例 ===');
  
  const config: AIAssistantConfig = {
    recognition: {
      source: 'camera',
      confidence: 0.7 // 物理识别置信度要求稍低
    },
    ai: {
      strategy: 'hybrid', // 混合策略适应不同局面
      difficulty: 'medium',
      timeLimit: 1500,
      explainDecisions: true
    },
    output: {
      mode: 'visual', // 可视化显示建议
      showAlternatives: false,
      voiceEnabled: true,
      language: 'zh-CN'
    },
    strategy: {
      level: StrategyLevel.BEGINNER,
      showExplanations: true,
      enableLearning: false
    }
  };

  const assistant = new AIGameAssistant(config);
  
  try {
    await assistant.start();
    console.log('摄像头AI辅助已启动，请将棋盘放在摄像头前...');
    
    // 语音提示
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('AI辅助已启动，请将棋盘放在摄像头前');
      utterance.lang = 'zh-CN';
      speechSynthesis.speak(utterance);
    }
    
  } catch (error) {
    console.error('摄像头启动失败:', error);
  }
}

/**
 * 示例3：手动输入模式
 * 适用于学习和分析特定局面
 */
export async function manualInputExample(): Promise<void> {
  console.log('=== 手动输入模式示例 ===');
  
  const config: AIAssistantConfig = {
    recognition: {
      source: 'manual'
    },
    ai: {
      strategy: 'minimax',
      difficulty: 'expert',
      timeLimit: 5000, // 允许更长的思考时间
      explainDecisions: true
    },
    output: {
      mode: 'suggest',
      showAlternatives: true,
      voiceEnabled: false
    },
    strategy: {
      level: StrategyLevel.ADVANCED,
      showExplanations: true,
      enableLearning: true
    }
  };

  const assistant = new AIGameAssistant(config);
  
  // 示例局面：X已经在中心，O在左上角
  const testBoard = [
    ['O', null, null],
    [null, 'X', null],
    [null, null, null]
  ];
  
  try {
    const decision = await assistant.manualInput(testBoard, 'X');
    console.log('AI建议:', decision);
    console.log('推荐位置:', `(${decision.action.row + 1}, ${decision.action.col + 1})`);
    console.log('置信度:', `${(decision.confidence * 100).toFixed(1)}%`);
    console.log('推理过程:', decision.reasoning);
    
    if (decision.alternatives.length > 0) {
      console.log('备选方案:');
      decision.alternatives.forEach((alt, index) => {
        console.log(`  ${index + 1}. (${alt.action.row + 1}, ${alt.action.col + 1}) - ${alt.reason}`);
      });
    }
    
  } catch (error) {
    console.error('分析失败:', error);
  }
}

/**
 * 示例4：移动端应用
 * 适用于手机和平板设备
 */
export async function mobileAppExample(): Promise<void> {
  console.log('=== 移动端应用示例 ===');
  
  const config: MobileConfig = {
    aiLevel: 'medium',
    showHints: true,
    vibrationEnabled: true,
    soundEnabled: true,
    autoSave: true,
    offlineMode: true
  };

  const mobileApp = new MobileAIAssistant(config);
  
  // 创建Canvas元素
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 500;
  canvas.style.border = '1px solid #ccc';
  canvas.style.touchAction = 'none'; // 防止滚动
  
  document.body.appendChild(canvas);
  
  try {
    await mobileApp.initialize(canvas);
    console.log('移动端AI应用已初始化');
    
    // 添加控制按钮
    const controlPanel = document.createElement('div');
    controlPanel.style.cssText = `
      margin-top: 10px;
      text-align: center;
    `;
    
    const resetButton = document.createElement('button');
    resetButton.textContent = '重新开始';
    resetButton.onclick = () => mobileApp.resetGame();
    
    const hintToggle = document.createElement('button');
    hintToggle.textContent = '切换提示';
    hintToggle.onclick = () => {
      config.showHints = !config.showHints;
      mobileApp.updateConfig({ showHints: config.showHints });
    };
    
    const difficultySelect = document.createElement('select');
    ['easy', 'medium', 'hard'].forEach(level => {
      const option = document.createElement('option');
      option.value = level;
      option.textContent = level === 'easy' ? '简单' : level === 'medium' ? '中等' : '困难';
      if (level === config.aiLevel) option.selected = true;
      difficultySelect.appendChild(option);
    });
    
    difficultySelect.onchange = () => {
      mobileApp.updateConfig({ aiLevel: difficultySelect.value as any });
    };
    
    controlPanel.appendChild(resetButton);
    controlPanel.appendChild(hintToggle);
    controlPanel.appendChild(difficultySelect);
    document.body.appendChild(controlPanel);
    
  } catch (error) {
    console.error('移动端应用初始化失败:', error);
  }
}

/**
 * 示例5：策略学习和分析
 * 展示如何使用策略简化器进行学习
 */
export async function strategyLearningExample(): Promise<void> {
  console.log('=== 策略学习和分析示例 ===');
  
  const config: AIAssistantConfig = {
    recognition: { source: 'manual' },
    ai: { strategy: 'minimax', difficulty: 'hard' },
    output: { mode: 'suggest' },
    strategy: {
      level: StrategyLevel.BEGINNER,
      showExplanations: true,
      enableLearning: true
    }
  };

  const assistant = new AIGameAssistant(config);
  
  // 模拟一些游戏历史
  const gameHistory = [
    {
      board: [
        [null, null, null],
        [null, 'X', null],
        [null, null, null]
      ],
      action: { row: 0, col: 0 },
      player: 'O' as const
    },
    {
      board: [
        ['O', null, null],
        [null, 'X', null],
        [null, null, null]
      ],
      action: { row: 0, col: 2 },
      player: 'X' as const
    },
    {
      board: [
        ['O', null, 'X'],
        [null, 'X', null],
        [null, null, null]
      ],
      action: { row: 2, col: 1 },
      player: 'O' as const
    }
  ];
  
  // 导入游戏历史
  assistant.importGameHistory(JSON.stringify(gameHistory));
  
  // 获取学习建议
  const learningAdvice = assistant.getLearningAdvice();
  
  if (learningAdvice) {
    console.log('=== 学习分析报告 ===');
    console.log('估计水平:', learningAdvice.assessment.estimatedLevel);
    console.log('优势:', learningAdvice.assessment.strengths);
    console.log('弱点:', learningAdvice.assessment.weaknesses);
    console.log('建议:', learningAdvice.assessment.suggestions);
    
    console.log('\n=== 学习指导 ===');
    console.log('核心概念:', learningAdvice.advice.concepts);
    console.log('练习建议:', learningAdvice.advice.exercises);
    console.log('下一级别:', learningAdvice.advice.nextLevel);
    
    console.log('\n=== 策略口诀 ===');
    learningAdvice.mnemonics.forEach((mnemonic: string, index: number) => {
      console.log(`${index + 1}. ${mnemonic}`);
    });
  }
}

/**
 * 示例6：性能测试
 * 测试AI决策的性能和准确性
 */
export async function performanceTestExample(): Promise<void> {
  console.log('=== 性能测试示例 ===');
  
  const config: AIAssistantConfig = {
    recognition: { source: 'manual' },
    ai: { strategy: 'minimax', difficulty: 'hard', timeLimit: 1000 },
    output: { mode: 'suggest' },
    strategy: { level: StrategyLevel.ADVANCED, showExplanations: false, enableLearning: false }
  };

  const assistant = new AIGameAssistant(config);
  
  // 测试不同的局面
  const testCases = [
    {
      name: '开局',
      board: [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ],
      player: 'X' as const
    },
    {
      name: '中局',
      board: [
        ['X', null, 'O'],
        [null, 'X', null],
        [null, null, null]
      ],
      player: 'O' as const
    },
    {
      name: '残局',
      board: [
        ['X', 'O', 'X'],
        ['O', 'X', null],
        [null, null, 'O']
      ],
      player: 'X' as const
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n测试场景: ${testCase.name}`);
    
    const startTime = Date.now();
    const decision = await assistant.manualInput(testCase.board, testCase.player);
    const endTime = Date.now();
    
    console.log(`决策时间: ${endTime - startTime}ms`);
    console.log(`推荐位置: (${decision.action.row + 1}, ${decision.action.col + 1})`);
    console.log(`置信度: ${(decision.confidence * 100).toFixed(1)}%`);
    console.log(`策略: ${decision.strategy}`);
  }
  
  // 获取系统状态
  const status = assistant.getStatus();
  console.log('\n=== 系统状态 ===');
  console.log('运行状态:', status.isRunning ? '运行中' : '已停止');
  console.log('错误计数:', status.errorCount);
  console.log('性能指标:', status.performance);
}

/**
 * 运行所有示例
 */
export async function runAllExamples(): Promise<void> {
  console.log('开始运行AI辅助系统示例...\n');
  
  try {
    // 注意：在实际使用中，这些示例应该根据具体环境选择性运行
    
    await manualInputExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await strategyLearningExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await performanceTestExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 移动端示例（需要DOM环境）
    if (typeof document !== 'undefined') {
      await mobileAppExample();
    }
    
    console.log('所有示例运行完成！');
    
  } catch (error) {
    console.error('示例运行失败:', error);
  }
}

// 导出便捷函数
export const examples = {
  desktop: desktopScreenAssistantExample,
  camera: cameraPhysicalBoardExample,
  manual: manualInputExample,
  mobile: mobileAppExample,
  learning: strategyLearningExample,
  performance: performanceTestExample,
  all: runAllExamples
};
