import { readFileSync } from 'fs';
import { OthelloAction, OthelloPlayer } from '../../core/types';
import { createOthelloBoard, getLegalActions, isGameOver, makeMove } from '../../core/game';

export interface WthorGameRecord {
  blackPlayer: string;
  whitePlayer: string;
  moves: OthelloAction[];
  invalidMoveTokens?: number;
}

export interface WthorTrainingSample {
  board: ReturnType<typeof createOthelloBoard>;
  player: OthelloPlayer;
  action: OthelloAction;
}

function parseAction(token: string): OthelloAction | null {
  const normalized = token.trim().toUpperCase();
  if (!/^[A-H][1-8]$/.test(normalized)) return null;
  const col = normalized.charCodeAt(0) - 'A'.charCodeAt(0);
  const row = Number(normalized[1]) - 1;
  return { row, col };
}

export function parseWthorSampleFile(filePath: string): WthorGameRecord[] {
  const content = readFileSync(filePath, 'utf8');
  const lines = content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => line.startsWith(';'));

  const blackLine = lines.find(line => line.startsWith(';BLACK_PLAYER=')) || ';BLACK_PLAYER=UnknownBlack';
  const whiteLine = lines.find(line => line.startsWith(';WHITE_PLAYER=')) || ';WHITE_PLAYER=UnknownWhite';
  const movesLine = lines.find(line => line.startsWith(';MOVES='));
  if (!movesLine) {
    throw new Error(`WTHOR样例缺少MOVES字段: ${filePath}`);
  }

  const moveTokens = movesLine
    .replace(';MOVES=', '')
    .split(/\s+/)
    .filter(Boolean);
  let invalidMoveTokens = 0;
  const moves = moveTokens
    .map(token => {
      const action = parseAction(token);
      if (!action) invalidMoveTokens++;
      return action;
    })
    .filter((item): item is OthelloAction => item !== null);

  return [
    {
      blackPlayer: blackLine.replace(';BLACK_PLAYER=', ''),
      whitePlayer: whiteLine.replace(';WHITE_PLAYER=', ''),
      moves,
      invalidMoveTokens
    }
  ];
}

export function buildTrainingSamplesFromWthor(records: WthorGameRecord[]): WthorTrainingSample[] {
  const samples: WthorTrainingSample[] = [];
  let skippedIllegalMoves = 0;

  for (const record of records) {
    let board = createOthelloBoard();
    let currentPlayer: OthelloPlayer = 'B';

    for (const action of record.moves) {
      const legalActions = getLegalActions(board, currentPlayer);
      const legal = legalActions.some(item => item.row === action.row && item.col === action.col);
      if (!legal) {
        skippedIllegalMoves++;
        currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
        if (isGameOver(board)) break;
        continue;
      }

      samples.push({
        board: board.map(row => [...row]),
        player: currentPlayer,
        action
      });

      board = makeMove(board, action, currentPlayer);
      currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
      if (isGameOver(board)) break;
    }
  }

  const invalidMoveTokens = records.reduce((sum, record) => sum + (record.invalidMoveTokens || 0), 0);
  console.log(`🧪 [WTHOR] 数据健壮性: invalidMoveTokens=${invalidMoveTokens}, skippedIllegalMoves=${skippedIllegalMoves}`);

  return samples;
}

export function runWthorSamplePipeline(samplePath: string): void {
  const records = parseWthorSampleFile(samplePath);
  const samples = buildTrainingSamplesFromWthor(records);
  console.log(`✅ [WTHOR] 解析完成: ${records.length} 局, 训练样本 ${samples.length} 条`);
  if (samples.length > 0) {
    const first = samples[0];
    console.log(`📄 [WTHOR] 样本示例: player=${first.player}, action=(${first.action.row},${first.action.col})`);
  }
}

if (require.main === module) {
  const samplePath = process.env.WTHOR_SAMPLE_PATH || 'src/othello/strategy/data/wthor-sample.txt';
  runWthorSamplePipeline(samplePath);
}
