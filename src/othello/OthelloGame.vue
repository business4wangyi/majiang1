<script setup lang="ts">
import { ref, onMounted } from 'vue';
import OthelloBoard from './OthelloBoard.vue';

type OthelloCell = 'B' | 'W' | null;
type OthelloBoardType = OthelloCell[][];
type OthelloPlayer = 'B' | 'W';

const API_BASE = 'http://localhost:4000';

const board = ref<OthelloBoardType>([]);
const currentPlayer = ref<OthelloPlayer>('B');
const legalMoves = ref<{ row: number; col: number }[]>([]);
const gameOver = ref(false);
const winner = ref<OthelloPlayer | 'Draw' | null>(null);

async function apiNewGame() {
  const res = await fetch(`${API_BASE}/new-game`);
  const data = await res.json();
  return data.board as OthelloBoardType;
}
async function apiLegalMoves(board: OthelloBoardType, player: OthelloPlayer) {
  const res = await fetch(`${API_BASE}/legal-moves`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board, player })
  });
  const data = await res.json();
  return data.moves as { row: number; col: number }[];
}
async function apiAiMove(board: OthelloBoardType, player: OthelloPlayer, aiType = 'heuristic') {
  const res = await fetch(`${API_BASE}/ai-move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board, player, aiType })
  });
  const data = await res.json();
  return data.action as { row: number; col: number } | null;
}

async function startNewGame() {
  board.value = await apiNewGame();
  currentPlayer.value = 'B';
  gameOver.value = false;
  winner.value = null;
  legalMoves.value = await apiLegalMoves(board.value, 'B');
}

onMounted(startNewGame);

async function handleMove(row: number, col: number) {
  if (gameOver.value) return;
  if (!legalMoves.value.some(m => m.row === row && m.col === col)) return;
  // 玩家落子
  const newBoard = board.value.map(r => [...r]);
  newBoard[row][col] = currentPlayer.value;
  board.value = newBoard;
  // 轮到AI
  currentPlayer.value = currentPlayer.value === 'B' ? 'W' : 'B';
  legalMoves.value = [];
  setTimeout(() => aiStep(newBoard, currentPlayer.value), 300);
}

async function aiStep(b: OthelloBoardType, aiPlayer: OthelloPlayer) {
  const moves = await apiLegalMoves(b, aiPlayer);
  if (moves.length === 0) {
    // AI无合法落子，判断是否结束
    const playerMoves = await apiLegalMoves(b, aiPlayer === 'B' ? 'W' : 'B');
    if (playerMoves.length === 0) {
      gameOver.value = true;
      // 判胜负
      const flat = b.flat();
      const bCount = flat.filter(c => c === 'B').length;
      const wCount = flat.filter(c => c === 'W').length;
      winner.value = bCount > wCount ? 'B' : wCount > bCount ? 'W' : 'Draw';
      return;
    } else {
      currentPlayer.value = aiPlayer === 'B' ? 'W' : 'B';
      legalMoves.value = playerMoves;
      return;
    }
  }
  // AI选择落子
  const action = await apiAiMove(b, aiPlayer);
  if (!action) return;
  const newBoard = b.map(r => [...r]);
  newBoard[action.row][action.col] = aiPlayer;
  board.value = newBoard;
  // 轮到玩家
  const player = aiPlayer === 'B' ? 'W' : 'B';
  const playerMoves = await apiLegalMoves(newBoard, player);
  if (playerMoves.length === 0) {
    // 玩家无合法落子，AI继续
    setTimeout(() => aiStep(newBoard, player), 300);
    return;
  }
  currentPlayer.value = player;
  legalMoves.value = playerMoves;
}
</script>

<template>
  <div style="padding:24px;">
    <OthelloBoard :board="board" :currentPlayer="currentPlayer" :legalMoves="legalMoves" @move="handleMove" />
    <div v-if="gameOver" style="margin-top:16px; font-weight:bold;">
      游戏结束！胜者: <span v-if="winner==='B'">● 黑棋</span><span v-else-if="winner==='W'">○ 白棋</span><span v-else>平局</span>
      <button @click="startNewGame" style="margin-left:16px;">重开一局</button>
    </div>
  </div>
</template>

<style scoped>
button { padding: 4px 12px; font-size: 16px; border-radius: 4px; border: 1px solid #197d43; background: #fff; cursor: pointer; }
button:hover { background: #e6f9ed; }
</style> 