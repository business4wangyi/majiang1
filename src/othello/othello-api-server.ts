import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createOthelloBoard, getLegalActions, makeMove } from './othello-game';
import { OthelloPlayer, OthelloBoard, OthelloAction } from './othello-types';
import { HeuristicOthelloAgent, MinimaxOthelloAgent } from './strategy';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 创建新棋盘
app.get('/new-game', (req, res) => {
  const board = createOthelloBoard();
  res.json({ board });
});

// 获取合法落子
app.post('/legal-moves', (req, res) => {
  const { board, player } = req.body;
  const moves = getLegalActions(board, player);
  res.json({ moves });
});

// AI推荐落子
app.post('/ai-move', (req, res) => {
  const { board, player, aiType } = req.body;
  let agent;
  if (aiType === 'minimax') {
    agent = new MinimaxOthelloAgent();
  } else {
    agent = new HeuristicOthelloAgent();
  }
  const action = agent.chooseAction(board, player);
  res.json({ action });
});

// 训练AI（可选，示例接口）
app.post('/train', (req, res) => {
  // 这里可实现QLearning等AI的训练逻辑
  res.json({ message: '训练已触发（示例）' });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`黑白棋AI API服务器运行在 http://localhost:${PORT}`);
}); 