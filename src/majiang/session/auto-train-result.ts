/** 自动对弈统计（可喂 CLI 展示与 nightly 形状断言） */
export interface AutoTrainPlayerStat {
  name: string;
  totalGames: number;
  winCount: number;
  drawCount: number;
  score: number;
  winRate: number;
  avgScore: number;
}

export interface AutoTrainResult {
  rounds: number;
  players: AutoTrainPlayerStat[];
}
