import { savePerformanceLogToFile, getPerfLogFileName, CONFIG } from '../tools/logger';
import { formatDuration, formatTimestamp } from '../tools/time-utils';
import fs from 'fs';
import path from 'path';

type TimeRecord = { start: number, end?: number };

interface PlayerRoundDetail {
  start: number;
  end?: number;
}

export class PerformanceMonitor {
  private gameStart: number = 0;
  private gameEnd: number = 0;
  private playerRounds: Record<string, TimeRecord[]> = {};
  private playerRoundDetails: Record<string, PlayerRoundDetail[]> = {};
  private static roundNumber = 0;
  private thisRoundNumber = 0;
  private thisRoundStart = 0;
  // 新增：任意环节耗时埋点
  private marks: { [label: string]: number } = {};
  private measureLogs: string[] = [];
  // 新增：全局统计
  private static totalGameTime = 0;
  private static totalRounds = 0;
  static programStart: number = 0;
  static programEnd: number = 0;
  private summaryPrinted = false;

  startGame() {
    PerformanceMonitor.roundNumber++;
    this.thisRoundNumber = PerformanceMonitor.roundNumber;
    this.gameStart = Date.now();
    this.thisRoundStart = this.gameStart;
    this.playerRounds = {};
    this.playerRoundDetails = {};
    this.marks = {};
    this.measureLogs = [];
  }
  endGame() {
    this.gameEnd = Date.now();
    // 只在每局真正结束时递增 totalRounds
    if (this.gameStart && this.gameEnd) {
      PerformanceMonitor.totalGameTime += (this.gameEnd - this.gameStart);
      PerformanceMonitor.totalRounds++;
    }
  }
  startPlayerRound(playerName: string) {
    if (!this.playerRounds[playerName]) this.playerRounds[playerName] = [];
    if (!this.playerRoundDetails[playerName]) this.playerRoundDetails[playerName] = [];
    const now = Date.now();
    this.playerRounds[playerName].push({ start: now });
    this.playerRoundDetails[playerName].push({ start: now });
  }
  endPlayerRound(playerName: string) {
    const rounds = this.playerRounds[playerName];
    const details = this.playerRoundDetails[playerName];
    const now = Date.now();
    if (rounds && rounds.length > 0 && !rounds[rounds.length - 1].end) {
      rounds[rounds.length - 1].end = now;
    }
    if (details && details.length > 0 && !details[details.length - 1].end) {
      details[details.length - 1].end = now;
    }
  }
  // 新增：任意环节埋点
  mark(label: string) {
    this.marks[label] = Date.now();
  }
  measure(label: string) {
    if (this.marks[label]) {
      const duration = Date.now() - this.marks[label];
      const msg = `${label} 耗时: ${formatDuration(duration)}`;
      this.measureLogs.push(`[${formatTimestamp(Date.now())}] ${msg}`);
      delete this.marks[label];
    }
  }
  static markProgramStart() {
    PerformanceMonitor.programStart = Date.now();
  }
  static markProgramEnd() {
    PerformanceMonitor.programEnd = Date.now();
  }
  printStats() {
    let output = `====== 第${this.thisRoundNumber}局 ${formatTimestamp(this.thisRoundStart)} ======\n`;
    if (this.gameStart && this.gameEnd) {
      output += `游戏总耗时: ${formatDuration(this.gameEnd - this.gameStart)}\n`;
    }
    for (const [player, rounds] of Object.entries(this.playerRounds)) {
      const times = rounds
        .filter(r => r.end)
        .map(r => (r.end! - r.start));
      const total = times.reduce((a, b) => a + b, 0);
      output += `${player} 行动次数: ${times.length}，总耗时: ${formatDuration(total)}，平均: ${times.length ? formatDuration(total / times.length) : '0秒'}\n`;
      // 每轮详细
      const details = this.playerRoundDetails[player] || [];
      details.forEach((d, idx) => {
        if (d.end) {
          output += `  第${idx + 1}轮: ${formatTimestamp(d.start)} ~ ${formatTimestamp(d.end)}，耗时: ${formatDuration(d.end - d.start)}\n`;
        }
      });
    }
    // 输出所有 measure 埋点
    if (this.measureLogs.length > 0) {
      output += `\n【环节耗时埋点】\n`;
      this.measureLogs.forEach(line => output += line + '\n');
    }
    output += '=====================\n';
    // 如果是第1局，清空 performance-summary-*.log
    if (this.thisRoundNumber === 1) {
      const perfLogDir = CONFIG.logDir;
      const perfLogFile = path.join(perfLogDir, getPerfLogFileName());
      if (fs.existsSync(perfLogFile)) fs.unlinkSync(perfLogFile);
    }
    savePerformanceLogToFile(output);
  }
  startNewRound() {
    // 只在新一局真正开始时递增
    PerformanceMonitor.roundNumber++;
    this.thisRoundNumber = PerformanceMonitor.roundNumber;
    this.gameStart = Date.now();
    this.thisRoundStart = this.gameStart;
    this.playerRounds = {};
    this.playerRoundDetails = {};
    this.marks = {};
    this.measureLogs = [];
  }
  safePrintStats(lastRound = false) {
    // 只在新一局开始和结束时调用，防止重复分隔线
    this.printStats();
    if (lastRound && !this.summaryPrinted) {
      this.summaryPrinted = true;
      PerformanceMonitor.markProgramEnd();
      let summary = `\n====== 所有${PerformanceMonitor.totalRounds}局总计 ======\n`;
      summary += `总耗时: ${formatDuration(PerformanceMonitor.totalGameTime)}\n`;
      if (PerformanceMonitor.programStart && PerformanceMonitor.programEnd) {
        summary += `程序启动时间: ${formatTimestamp(PerformanceMonitor.programStart)}\n`;
        summary += `程序结束时间: ${formatTimestamp(PerformanceMonitor.programEnd)}\n`;
        summary += `程序总耗时: ${formatDuration(PerformanceMonitor.programEnd - PerformanceMonitor.programStart)}\n`;
      }
      summary += '=====================\n';
      savePerformanceLogToFile(summary);
    }
  }
}

export const perfMonitor = new PerformanceMonitor(); 