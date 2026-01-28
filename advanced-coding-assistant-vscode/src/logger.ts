import * as vscode from 'vscode';
import { ConfigurationManager } from './config';

/**
 * Log levels enum
 */
export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
}

/**
 * Logger class for the Advanced Coding Assistant extension
 */
export class Logger {
  private static outputChannel: vscode.OutputChannel | undefined;
  private static logLevelMap: Map<string, LogLevel> = new Map([
    ['debug', LogLevel.Debug],
    ['info', LogLevel.Info],
    ['warn', LogLevel.Warn],
    ['error', LogLevel.Error],
  ]);

  /**
   * Initializes the logger
   */
  public static initialize(): void {
    if (!this.outputChannel) {
      this.outputChannel = vscode.window.createOutputChannel('Advanced Coding Assistant');
    }
  }

  /**
   * Gets the output channel
   */
  public static getOutputChannel(): vscode.OutputChannel | undefined {
    return this.outputChannel;
  }

  /**
   * Shows the output channel
   */
  public static show(): void {
    this.outputChannel?.show();
  }

  /**
   * Logs a debug message
   */
  public static debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.Debug, message, ...args);
  }

  /**
   * Logs an info message
   */
  public static info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.Info, message, ...args);
  }

  /**
   * Logs a warning message
   */
  public static warn(message: string, ...args: unknown[]): void {
    this.log(LogLevel.Warn, message, ...args);
  }

  /**
   * Logs an error message
   */
  public static error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.log(LogLevel.Error, `${message}${error ? ': ' + errorMessage : ''}`, ...args);
    if (error instanceof Error && error.stack) {
      this.log(LogLevel.Error, error.stack);
    }
  }

  /**
   * Logs a message with the specified level
   */
  private static log(level: LogLevel, message: string, ...args: unknown[]): void {
    const configuredLevel =
      this.logLevelMap.get(ConfigurationManager.getLogLevel()) ?? LogLevel.Info;

    if (level < configuredLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level].toUpperCase();
    const formattedMessage = `[${timestamp}] [${levelName}] ${message}`;

    if (args.length > 0) {
      this.outputChannel?.appendLine(`${formattedMessage} ${JSON.stringify(args)}`);
    } else {
      this.outputChannel?.appendLine(formattedMessage);
    }
  }

  /**
   * Disposes the logger
   */
  public static dispose(): void {
    this.outputChannel?.dispose();
    this.outputChannel = undefined;
  }
}
