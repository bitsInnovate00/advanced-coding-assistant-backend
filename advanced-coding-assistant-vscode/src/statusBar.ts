import * as vscode from 'vscode';

/**
 * Connection status enum
 */
export enum ConnectionStatus {
  Disconnected = 'Disconnected',
  Connecting = 'Connecting',
  Connected = 'Connected',
  Error = 'Error',
}

/**
 * Status bar manager for the Advanced Coding Assistant extension
 */
export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;
  private currentStatus: ConnectionStatus = ConnectionStatus.Disconnected;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarItem.command = 'advanced-coding-assistant.showStatus';
    this.updateStatusBar();
    this.statusBarItem.show();
  }

  /**
   * Updates the connection status
   */
  public updateStatus(status: ConnectionStatus, message?: string): void {
    this.currentStatus = status;
    this.updateStatusBar(message);
  }

  /**
   * Gets the current connection status
   */
  public getStatus(): ConnectionStatus {
    return this.currentStatus;
  }

  /**
   * Updates the status bar item
   */
  private updateStatusBar(message?: string): void {
    const statusIcon = this.getStatusIcon(this.currentStatus);
    const statusText = message || this.currentStatus;
    this.statusBarItem.text = `$(${statusIcon}) Assistant: ${statusText}`;
    this.statusBarItem.tooltip = this.getStatusTooltip(this.currentStatus);
  }

  /**
   * Gets the icon for the status
   */
  private getStatusIcon(status: ConnectionStatus): string {
    switch (status) {
      case ConnectionStatus.Connected:
        return 'check';
      case ConnectionStatus.Connecting:
        return 'sync~spin';
      case ConnectionStatus.Error:
        return 'error';
      case ConnectionStatus.Disconnected:
      default:
        return 'circle-slash';
    }
  }

  /**
   * Gets the tooltip for the status
   */
  private getStatusTooltip(status: ConnectionStatus): string {
    switch (status) {
      case ConnectionStatus.Connected:
        return 'Advanced Coding Assistant is connected';
      case ConnectionStatus.Connecting:
        return 'Connecting to Advanced Coding Assistant...';
      case ConnectionStatus.Error:
        return 'Error connecting to Advanced Coding Assistant. Click for details.';
      case ConnectionStatus.Disconnected:
      default:
        return 'Advanced Coding Assistant is disconnected. Click to connect.';
    }
  }

  /**
   * Disposes the status bar item
   */
  public dispose(): void {
    this.statusBarItem.dispose();
  }
}
