// {{ AURA-X: Add - 创建API服务器测试脚本. Approval: 寸止(ID:1735819200). }}

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:4000';

interface TestResult {
  endpoint: string;
  success: boolean;
  message: string;
  data?: any;
}

async function testAPI(): Promise<void> {
  console.log('🧪 开始测试Othello API服务器');
  console.log('='.repeat(50));

  const results: TestResult[] = [];

  // 测试1: 创建新游戏
  try {
    console.log('\n📋 测试1: 创建新游戏 (/new-game)');
    const response = await fetch(`${API_BASE}/new-game`);
    const data = await response.json();
    
    if (response.ok && data.board && Array.isArray(data.board) && data.board.length === 8) {
      results.push({
        endpoint: '/new-game',
        success: true,
        message: '✅ 成功创建8x8棋盘',
        data: data.board
      });
      console.log('✅ 成功创建8x8棋盘');
      console.log('📊 初始棋盘状态：');
      printBoard(data.board);
    } else {
      results.push({
        endpoint: '/new-game',
        success: false,
        message: '❌ 棋盘格式不正确',
        data
      });
      console.log('❌ 棋盘格式不正确');
    }
  } catch (error) {
    results.push({
      endpoint: '/new-game',
      success: false,
      message: `❌ 请求失败: ${error}`
    });
    console.log(`❌ 请求失败: ${error}`);
  }

  // 测试2: 获取合法移动
  try {
    console.log('\n📋 测试2: 获取合法移动 (/legal-moves)');
    const newGameResponse = await fetch(`${API_BASE}/new-game`);
    const { board } = await newGameResponse.json();
    
    const response = await fetch(`${API_BASE}/legal-moves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ board, player: 'B' })
    });
    const data = await response.json();
    
    if (response.ok && data.moves && Array.isArray(data.moves)) {
      results.push({
        endpoint: '/legal-moves',
        success: true,
        message: `✅ 成功获取${data.moves.length}个合法移动`,
        data: data.moves
      });
      console.log(`✅ 成功获取${data.moves.length}个合法移动`);
      console.log('📍 合法位置：');
      data.moves.forEach((move: any, index: number) => {
        console.log(`   ${index + 1}. (${move.row + 1}, ${move.col + 1})`);
      });
    } else {
      results.push({
        endpoint: '/legal-moves',
        success: false,
        message: '❌ 合法移动格式不正确',
        data
      });
      console.log('❌ 合法移动格式不正确');
    }
  } catch (error) {
    results.push({
      endpoint: '/legal-moves',
      success: false,
      message: `❌ 请求失败: ${error}`
    });
    console.log(`❌ 请求失败: ${error}`);
  }

  // 测试3: AI推荐移动 (启发式)
  try {
    console.log('\n📋 测试3: AI推荐移动 - 启发式 (/ai-move)');
    const newGameResponse = await fetch(`${API_BASE}/new-game`);
    const { board } = await newGameResponse.json();
    
    const response = await fetch(`${API_BASE}/ai-move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ board, player: 'B', aiType: 'heuristic' })
    });
    const data = await response.json();
    
    if (response.ok && data.action && typeof data.action.row === 'number' && typeof data.action.col === 'number') {
      results.push({
        endpoint: '/ai-move (heuristic)',
        success: true,
        message: `✅ AI推荐位置: (${data.action.row + 1}, ${data.action.col + 1})`,
        data: data.action
      });
      console.log(`✅ AI推荐位置: (${data.action.row + 1}, ${data.action.col + 1})`);
    } else {
      results.push({
        endpoint: '/ai-move (heuristic)',
        success: false,
        message: '❌ AI推荐格式不正确',
        data
      });
      console.log('❌ AI推荐格式不正确');
    }
  } catch (error) {
    results.push({
      endpoint: '/ai-move (heuristic)',
      success: false,
      message: `❌ 请求失败: ${error}`
    });
    console.log(`❌ 请求失败: ${error}`);
  }

  // 测试4: AI推荐移动 (极小极大)
  try {
    console.log('\n📋 测试4: AI推荐移动 - 极小极大 (/ai-move)');
    const newGameResponse = await fetch(`${API_BASE}/new-game`);
    const { board } = await newGameResponse.json();
    
    const response = await fetch(`${API_BASE}/ai-move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ board, player: 'B', aiType: 'minimax' })
    });
    const data = await response.json();
    
    if (response.ok && data.action && typeof data.action.row === 'number' && typeof data.action.col === 'number') {
      results.push({
        endpoint: '/ai-move (minimax)',
        success: true,
        message: `✅ AI推荐位置: (${data.action.row + 1}, ${data.action.col + 1})`,
        data: data.action
      });
      console.log(`✅ AI推荐位置: (${data.action.row + 1}, ${data.action.col + 1})`);
    } else {
      results.push({
        endpoint: '/ai-move (minimax)',
        success: false,
        message: '❌ AI推荐格式不正确',
        data
      });
      console.log('❌ AI推荐格式不正确');
    }
  } catch (error) {
    results.push({
      endpoint: '/ai-move (minimax)',
      success: false,
      message: `❌ 请求失败: ${error}`
    });
    console.log(`❌ 请求失败: ${error}`);
  }

  // 测试5: 训练接口
  try {
    console.log('\n📋 测试5: 训练接口 (/train)');
    const response = await fetch(`${API_BASE}/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await response.json();
    
    if (response.ok && data.message) {
      results.push({
        endpoint: '/train',
        success: true,
        message: `✅ 训练接口响应: ${data.message}`,
        data
      });
      console.log(`✅ 训练接口响应: ${data.message}`);
    } else {
      results.push({
        endpoint: '/train',
        success: false,
        message: '❌ 训练接口响应格式不正确',
        data
      });
      console.log('❌ 训练接口响应格式不正确');
    }
  } catch (error) {
    results.push({
      endpoint: '/train',
      success: false,
      message: `❌ 请求失败: ${error}`
    });
    console.log(`❌ 请求失败: ${error}`);
  }

  // 输出测试总结
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试总结');
  console.log('='.repeat(50));
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`✅ 成功: ${successCount}/${totalCount}`);
  console.log(`❌ 失败: ${totalCount - successCount}/${totalCount}`);
  console.log(`📈 成功率: ${(successCount / totalCount * 100).toFixed(1)}%`);
  
  console.log('\n📋 详细结果：');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.endpoint}: ${result.success ? '✅' : '❌'} ${result.message}`);
  });

  if (successCount === totalCount) {
    console.log('\n🎉 所有API端点测试通过！');
  } else {
    console.log('\n⚠️ 部分API端点测试失败，请检查服务器状态');
  }
}

function printBoard(board: any[][]): void {
  console.log('   a b c d e f g h');
  for (let i = 0; i < 8; i++) {
    let row = `${i + 1}  `;
    for (let j = 0; j < 8; j++) {
      const cell = board[i][j];
      if (cell === 'B') row += '● ';
      else if (cell === 'W') row += '○ ';
      else row += '. ';
    }
    console.log(row);
  }
}

// 运行测试
if (require.main === module) {
  testAPI().catch(console.error);
}
