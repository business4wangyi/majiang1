import { execFile } from 'child_process';
import { promisify } from 'util';
import { OthelloBoard, OthelloAction, OthelloPlayer } from '../../core/types';

const execFileAsync = promisify(execFile);

export interface EdaxEngineConfig {
  executablePath: string;
  level?: number;
  moveTimeoutMs?: number;
}

export interface EdaxMoveResult {
  action: OthelloAction;
  rawOutput: string;
  args: string[];
  matchedFragment?: {
    mode: 'prefixed' | 'fallback';
    source: string;
    coordinate: string;
  };
}

type EdaxSmokeFailureReason = 'missing-path' | 'process-failed' | 'parse-failed';

class EdaxError extends Error {
  code: string;
  reason: EdaxSmokeFailureReason;

  constructor(code: string, reason: EdaxSmokeFailureReason, message: string) {
    super(message);
    this.name = 'EdaxError';
    this.code = code;
    this.reason = reason;
  }
}

function boardToFen(board: OthelloBoard, player: OthelloPlayer): string {
  const chars: string[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = board[row][col];
      chars.push(cell === null ? '-' : cell);
    }
  }
  return `${chars.join('')} ${player}`;
}

function buildAction(file: string, rank: string): OthelloAction {
  const col = file.charCodeAt(0) - 'A'.charCodeAt(0);
  const row = Number(rank) - 1;
  return { row, col };
}

function buildFallbackSource(rawOutput: string, matchIndex: number): string {
  const lineNumber = rawOutput.slice(0, matchIndex).split(/\r?\n/).length;
  const line = rawOutput.split(/\r?\n/)[lineNumber - 1] || '';
  return `line ${lineNumber}: ${line.trim()}`;
}

function buildEdaxArgs(level: number, fen: string): string[] {
  return ['-l', String(level), '-eval', '-f', fen];
}

export function parseMove(rawOutput: string): { action: OthelloAction; matchedFragment: EdaxMoveResult['matchedFragment'] } | null {
  const prefixedPattern = /^\s*(?:BEST\s*MOVE|BESTMOVE|MOVE)\b(?:\s*[:=]\s*|\s+)([A-H])([1-8])\b/i;
  const lines = rawOutput.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const prefixedMatch = lines[i].match(prefixedPattern);
    if (!prefixedMatch) continue;
    const file = prefixedMatch[1].toUpperCase();
    const rank = prefixedMatch[2];
    return {
      action: buildAction(file, rank),
      matchedFragment: {
        mode: 'prefixed',
        source: `line ${i + 1}: ${lines[i].trim()}`,
        coordinate: `${file}${rank}`
      }
    };
  }

  const fallbackMatches = [...rawOutput.matchAll(/\b([A-H])([1-8])\b/gi)];
  const fallbackMatch = fallbackMatches.length > 0 ? fallbackMatches[fallbackMatches.length - 1] : null;
  if (!fallbackMatch) return null;

  const file = fallbackMatch[1].toUpperCase();
  const rank = fallbackMatch[2];
  const index = fallbackMatch.index ?? 0;
  return {
    action: buildAction(file, rank),
    matchedFragment: {
      mode: 'fallback',
      source: buildFallbackSource(rawOutput, index),
      coordinate: `${file}${rank}`
    }
  };
}

export class EdaxEngine {
  private readonly config: EdaxEngineConfig;

  constructor(config: EdaxEngineConfig) {
    this.config = config;
  }

  async getBestMove(board: OthelloBoard, player: OthelloPlayer): Promise<EdaxMoveResult> {
    const fen = boardToFen(board, player);
    const level = this.config.level || 1;
    const timeout = this.config.moveTimeoutMs || 3000;

    const args = buildEdaxArgs(level, fen);
    let stdout = '';
    let stderr = '';
    try {
      const output = await execFileAsync(this.config.executablePath, args, {
        timeout,
        maxBuffer: 1024 * 1024
      });
      stdout = output.stdout || '';
      stderr = output.stderr || '';
    } catch (error: any) {
      const message = error?.message || String(error);
      throw new EdaxError('EDAX_PROCESS_FAILED', 'process-failed', `Edax进程调用失败: ${message}`);
    }
    const merged = `${stdout || ''}\n${stderr || ''}`.trim();
    const parsedMove = parseMove(merged);

    if (!parsedMove) {
      throw new EdaxError('EDAX_PARSE_FAILED', 'parse-failed', `Edax输出中未解析到合法落子: ${merged.slice(0, 240)}`);
    }
    console.log(`🔎 [Edax] 解析命中: ${JSON.stringify(parsedMove.matchedFragment)}`);

    return {
      action: parsedMove.action,
      rawOutput: merged,
      args,
      matchedFragment: parsedMove.matchedFragment
    };
  }
}

export async function runEdaxSmokeTest(): Promise<void> {
  const executablePath = process.env.EDAX_PATH;
  const required = process.env.EDAX_REQUIRED === 'true';
  if (!executablePath) {
    if (required) {
      const missingPathError = new EdaxError(
        'EDAX_PATH_MISSING',
        'missing-path',
        '[Edax] EDAX_REQUIRED=true 但未设置 EDAX_PATH'
      );
      console.error(`❌ [Edax] ${JSON.stringify({ code: missingPathError.code, reason: missingPathError.reason, message: missingPathError.message })}`);
      throw missingPathError;
    }
    console.log('⚠️ [Edax] 未设置 EDAX_PATH，跳过 smoke test');
    return;
  }

  const sampleBoard: OthelloBoard = Array.from({ length: 8 }, () => Array(8).fill(null));
  sampleBoard[3][3] = 'W';
  sampleBoard[3][4] = 'B';
  sampleBoard[4][3] = 'B';
  sampleBoard[4][4] = 'W';

  const engine = new EdaxEngine({
    executablePath,
    level: Number(process.env.EDAX_LEVEL) || 1,
    moveTimeoutMs: Number(process.env.EDAX_TIMEOUT_MS) || 3000
  });
  const smokeStartedAt = Date.now();

  try {
    const result = await engine.getBestMove(sampleBoard, 'B');
    const elapsedMs = Date.now() - smokeStartedAt;
    console.log(`✅ [Edax] 调用成功: row=${result.action.row}, col=${result.action.col}`);
    console.log(`✅ [EdaxSmoke] ${JSON.stringify({
      enginePath: executablePath,
      args: result.args,
      matchedFragment: result.matchedFragment || null,
      elapsedMs
    })}`);
    console.log(`📄 [Edax] 输出样例: ${result.rawOutput.slice(0, 200)}`);
  } catch (error: any) {
    const typedError: EdaxError =
      error instanceof EdaxError
        ? error
        : new EdaxError('EDAX_PROCESS_FAILED', 'process-failed', error?.message || String(error));
    console.error(`❌ [Edax] 调用失败: ${typedError.message}`);
    if (required) {
      console.error(`❌ [Edax] ${JSON.stringify({ code: typedError.code, reason: typedError.reason, message: typedError.message })}`);
      throw typedError;
    }
  }
}

if (require.main === module) {
  runEdaxSmokeTest().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
