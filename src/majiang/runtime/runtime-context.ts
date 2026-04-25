export type MajiangFatalMode = 'exit' | 'throw';

export interface MajiangRuntimeOptions {
  silentOutput?: boolean;
  fatalMode?: MajiangFatalMode;
  fileLoggingEnabled?: boolean;
  consoleLoggingEnabled?: boolean;
}

const runtimeState: Required<MajiangRuntimeOptions> = {
  silentOutput: false,
  fatalMode: 'exit',
  fileLoggingEnabled: true,
  consoleLoggingEnabled: true
};

export class MajiangRuntimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MajiangRuntimeError';
  }
}

export function getMajiangRuntimeOptions(): Required<MajiangRuntimeOptions> {
  return { ...runtimeState };
}

export function updateMajiangRuntimeOptions(options: MajiangRuntimeOptions): void {
  if (options.silentOutput !== undefined) {
    runtimeState.silentOutput = options.silentOutput;
  }

  if (options.fatalMode !== undefined) {
    runtimeState.fatalMode = options.fatalMode;
  }

  if (options.fileLoggingEnabled !== undefined) {
    runtimeState.fileLoggingEnabled = options.fileLoggingEnabled;
  }

  if (options.consoleLoggingEnabled !== undefined) {
    runtimeState.consoleLoggingEnabled = options.consoleLoggingEnabled;
  }
}

export function resetMajiangRuntimeOptions(): void {
  runtimeState.silentOutput = false;
  runtimeState.fatalMode = 'exit';
  runtimeState.fileLoggingEnabled = true;
  runtimeState.consoleLoggingEnabled = true;
}

export function isMajiangOutputSilent(): boolean {
  return runtimeState.silentOutput;
}

export function isMajiangFileLoggingEnabled(): boolean {
  return runtimeState.fileLoggingEnabled;
}

export function isMajiangConsoleLoggingEnabled(): boolean {
  return runtimeState.consoleLoggingEnabled;
}

export function handleMajiangFatal(message: string, exitCode: number = 1): never {
  if (runtimeState.fatalMode === 'throw') {
    throw new MajiangRuntimeError(message);
  }

  process.exit(exitCode);
}
