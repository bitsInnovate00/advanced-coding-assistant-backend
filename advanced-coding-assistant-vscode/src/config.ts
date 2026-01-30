import * as vscode from 'vscode';

/**
 * Configuration manager for the Advanced Coding Assistant extension
 */
export class ConfigurationManager {
  private static readonly CONFIG_SECTION = 'advancedCodingAssistant';

  /**
   * Gets the API endpoint URL
   */
  public static getApiEndpoint(): string {
    return this.getConfig<string>('apiEndpoint', 'http://localhost:8080');
  }

  /**
   * Gets whether telemetry is enabled
   */
  public static isTelemetryEnabled(): boolean {
    return this.getConfig<boolean>('enableTelemetry', false);
  }

  /**
   * Gets the log level
   */
  public static getLogLevel(): string {
    return this.getConfig<string>('logLevel', 'info');
  }

  /**
   * Gets whether auto-connect is enabled
   */
  public static isAutoConnectEnabled(): boolean {
    return this.getConfig<boolean>('autoConnect', true);
  }

  /**
   * Gets the chat model to use for completions
   */
  public static getChatModel(): string {
    return this.getConfig<string>('chatModel', 'gpt-4');
  }

  /**
   * Gets a configuration value
   */
  private static getConfig<T>(key: string, defaultValue: T): T {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    return config.get<T>(key, defaultValue);
  }

  /**
   * Updates a configuration value
   */
  public static async updateConfig(key: string, value: unknown): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    await config.update(key, value, vscode.ConfigurationTarget.Global);
  }
}
