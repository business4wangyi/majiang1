/**
 * AI助手框架演示测试脚本
 * 用于验证演示页面的核心功能
 */

// 测试配置
const TEST_CONFIG = {
    autoTest: true,
    testDelay: 1000,
    verbose: true
};

// 测试结果记录
let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

/**
 * 测试工具函数
 */
function log(message, type = 'info') {
    if (TEST_CONFIG.verbose) {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }
}

function assert(condition, message) {
    testResults.total++;
    if (condition) {
        testResults.passed++;
        testResults.details.push({ test: message, result: 'PASS' });
        log(`PASS: ${message}`, 'success');
    } else {
        testResults.failed++;
        testResults.details.push({ test: message, result: 'FAIL' });
        log(`FAIL: ${message}`, 'error');
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 测试游戏基础功能
 */
async function testGameBasics() {
    log('开始测试游戏基础功能...');
    
    // 测试棋盘初始化
    const board = document.getElementById('gameBoard');
    assert(board !== null, '棋盘元素存在');
    
    const cells = board.querySelectorAll('.cell');
    assert(cells.length === 9, '棋盘有9个格子');
    
    // 测试游戏状态
    assert(typeof gameBoard !== 'undefined', '游戏状态变量存在');
    assert(Array.isArray(gameBoard), '游戏状态是数组');
    assert(gameBoard.length === 3, '游戏状态是3x3');
    
    // 测试当前玩家
    assert(typeof currentPlayer !== 'undefined', '当前玩家变量存在');
    assert(currentPlayer === 'X', '游戏从X开始');
    
    log('游戏基础功能测试完成');
}

/**
 * 测试AI功能
 */
async function testAIFunctions() {
    log('开始测试AI功能...');
    
    // 测试AI配置
    assert(typeof aiConfig !== 'undefined', 'AI配置对象存在');
    assert(typeof aiConfig.strategy === 'string', 'AI策略配置存在');
    
    // 测试AI决策函数
    assert(typeof simulateAIDecision === 'function', 'AI决策函数存在');
    assert(typeof getLegalMoves === 'function', '合法移动函数存在');
    assert(typeof checkWinnerForBoard === 'function', '获胜检查函数存在');
    
    // 测试合法移动获取
    const legalMoves = getLegalMoves();
    assert(Array.isArray(legalMoves), '合法移动返回数组');
    assert(legalMoves.length === 9, '空棋盘有9个合法移动');
    
    // 测试AI决策
    try {
        const decision = await simulateAIDecision();
        assert(typeof decision === 'object', 'AI决策返回对象');
        assert(typeof decision.action === 'object', 'AI决策包含行动');
        assert(typeof decision.confidence === 'number', 'AI决策包含置信度');
        assert(typeof decision.reasoning === 'string', 'AI决策包含推理');
        assert(decision.confidence >= 0 && decision.confidence <= 1, '置信度在有效范围内');
        log(`AI决策测试成功: 建议位置(${decision.action.row}, ${decision.action.col}), 置信度${(decision.confidence * 100).toFixed(0)}%`);
    } catch (error) {
        assert(false, `AI决策测试失败: ${error.message}`);
    }
    
    log('AI功能测试完成');
}

/**
 * 测试UI交互功能
 */
async function testUIInteractions() {
    log('开始测试UI交互功能...');
    
    // 测试配置面板
    const strategySelect = document.getElementById('aiStrategy');
    const difficultySelect = document.getElementById('difficulty');
    const voiceBtn = document.getElementById('voiceBtn');
    
    assert(strategySelect !== null, 'AI策略选择器存在');
    assert(difficultySelect !== null, '难度选择器存在');
    assert(voiceBtn !== null, '语音按钮存在');
    
    // 测试显示元素
    const decisionDisplay = document.getElementById('decisionDisplay');
    const confidenceFill = document.getElementById('confidenceFill');
    const positionAnalysis = document.getElementById('positionAnalysis');
    
    assert(decisionDisplay !== null, '决策显示区域存在');
    assert(confidenceFill !== null, '置信度条存在');
    assert(positionAnalysis !== null, '局面分析区域存在');
    
    // 测试功能函数
    assert(typeof resetGame === 'function', '重置游戏函数存在');
    assert(typeof getAIHelp === 'function', 'AI帮助函数存在');
    assert(typeof toggleVoice === 'function', '语音切换函数存在');
    assert(typeof updateAIConfig === 'function', '配置更新函数存在');
    
    log('UI交互功能测试完成');
}

/**
 * 测试游戏逻辑
 */
async function testGameLogic() {
    log('开始测试游戏逻辑...');
    
    // 重置游戏
    resetGame();
    assert(gameBoard.every(row => row.every(cell => cell === null)), '重置后棋盘为空');
    assert(currentPlayer === 'X', '重置后从X开始');
    assert(moveHistory.length === 0, '重置后移动历史为空');
    
    // 测试下棋
    makeMove(1, 1); // 中心位置
    assert(gameBoard[1][1] === 'X', '下棋后棋盘状态正确');
    assert(currentPlayer === 'O', '下棋后玩家切换');
    assert(moveHistory.length === 1, '移动历史记录正确');
    
    // 测试撤销
    undoMove();
    assert(gameBoard[1][1] === null, '撤销后棋盘状态恢复');
    assert(currentPlayer === 'X', '撤销后玩家恢复');
    assert(moveHistory.length === 0, '撤销后移动历史恢复');
    
    // 测试获胜检测
    // 创建获胜局面
    gameBoard[0][0] = 'X';
    gameBoard[0][1] = 'X';
    gameBoard[0][2] = 'X';
    
    const winner = checkWinner();
    assert(winner === 'X', '获胜检测正确');
    
    // 重置测试环境
    resetGame();
    
    log('游戏逻辑测试完成');
}

/**
 * 测试语音功能
 */
async function testVoiceFunctions() {
    log('开始测试语音功能...');
    
    // 检查语音API可用性
    const speechSupported = 'speechSynthesis' in window;
    log(`浏览器语音合成支持: ${speechSupported ? '是' : '否'}`);
    
    // 测试语音切换
    const initialVoiceState = isVoiceEnabled;
    toggleVoice();
    assert(isVoiceEnabled !== initialVoiceState, '语音状态切换成功');
    
    // 恢复初始状态
    if (isVoiceEnabled !== initialVoiceState) {
        toggleVoice();
    }
    
    // 测试语音播报函数
    assert(typeof speakDecision === 'function', '语音播报函数存在');
    
    log('语音功能测试完成');
}

/**
 * 运行完整测试套件
 */
async function runAllTests() {
    log('🚀 开始AI助手框架演示测试...');
    
    try {
        await testGameBasics();
        await sleep(TEST_CONFIG.testDelay);
        
        await testAIFunctions();
        await sleep(TEST_CONFIG.testDelay);
        
        await testUIInteractions();
        await sleep(TEST_CONFIG.testDelay);
        
        await testGameLogic();
        await sleep(TEST_CONFIG.testDelay);
        
        await testVoiceFunctions();
        
        // 输出测试结果
        log('📊 测试结果汇总:');
        log(`总测试数: ${testResults.total}`);
        log(`通过: ${testResults.passed}`, 'success');
        log(`失败: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
        log(`成功率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
        
        if (testResults.failed > 0) {
            log('❌ 失败的测试:');
            testResults.details
                .filter(detail => detail.result === 'FAIL')
                .forEach(detail => log(`  - ${detail.test}`, 'error'));
        } else {
            log('🎉 所有测试通过！', 'success');
        }
        
    } catch (error) {
        log(`测试过程中发生错误: ${error.message}`, 'error');
    }
}

/**
 * 页面加载完成后自动运行测试
 */
if (TEST_CONFIG.autoTest) {
    // 等待页面完全加载
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(runAllTests, 1000);
        });
    } else {
        setTimeout(runAllTests, 1000);
    }
}

// 导出测试函数供手动调用
window.runDemoTests = runAllTests;
window.testResults = testResults;
