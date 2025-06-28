<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

type OthelloCell = 'B' | 'W' | null;
type OthelloBoardType = OthelloCell[][];
type OthelloPlayer = 'B' | 'W';

const props = defineProps<{
  board: OthelloBoardType;
  currentPlayer: OthelloPlayer;
  legalMoves?: { row: number; col: number }[];
}>();
const emit = defineEmits<{
  (e: 'move', row: number, col: number): void;
}>();

function isLegal(row: number, col: number) {
  return props.legalMoves?.some(m => m.row === row && m.col === col);
}
</script>

<template>
  <div style="display:inline-block; border:2px solid #333; background:#197d43; padding:8px;">
    <div :style="{
      marginBottom: '8px', fontWeight: 'bold', color: props.currentPlayer === 'B' ? '#111' : '#eee',
      background: props.currentPlayer === 'B' ? '#fff' : '#111', padding: '4px 8px', borderRadius: '4px'
    }">
      当前玩家: <span v-if="props.currentPlayer === 'B'">● 黑棋</span><span v-else>○ 白棋</span>
    </div>
    <table style="border-collapse:collapse;">
      <tbody>
        <tr v-for="(row, i) in props.board" :key="i">
          <td v-for="(cell, j) in row" :key="j"
              :style="{
                width: '36px', height: '36px', border: '1px solid #333',
                background: isLegal(i, j) ? '#6fcf97' : '#197d43',
                cursor: isLegal(i, j) ? 'pointer' : 'default', textAlign: 'center', verticalAlign: 'middle'
              }"
              @click="isLegal(i, j) && emit('move', i, j)">
            <div v-if="cell === 'B'" style="width:28px; height:28px; border-radius:50%; background:#111; margin:auto;"></div>
            <div v-else-if="cell === 'W'" style="width:28px; height:28px; border-radius:50%; background:#fff; border:2px solid #111; margin:auto;"></div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
table { user-select: none; }
</style> 