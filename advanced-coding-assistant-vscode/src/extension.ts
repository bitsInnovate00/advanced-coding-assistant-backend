// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ConfigurationManager } from './config';
import { Logger } from './logger';
import { StatusBarManager, ConnectionStatus } from './statusBar';
import { ErrorHandler } from './errorHandler';
import { TelemetryManager, TelemetryEventType } from './telemetry';

let statusBarManager: StatusBarManager | undefined;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  try {
    // Initialize logger
    Logger.initialize();
    Logger.info('Activating Advanced Coding Assistant extension...');

    // Initialize telemetry (opt-in)
    TelemetryManager.initialize();

    // Create status bar manager
    statusBarManager = new StatusBarManager();
    context.subscriptions.push(statusBarManager);

    // Register commands
    registerCommands(context);

    // Attempt auto-connect if enabled
    if (ConfigurationManager.isAutoConnectEnabled()) {
      await attemptConnection();
    }

    Logger.info('Advanced Coding Assistant extension activated successfully');
    
    // Send activation telemetry event
    TelemetryManager.sendEvent(TelemetryEventType.ExtensionActivated, {
      autoConnect: ConfigurationManager.isAutoConnectEnabled(),
    });
  } catch (error) {
    await ErrorHandler.handleError(error, 'Failed to activate Advanced Coding Assistant extension');
    TelemetryManager.sendError(error, { context: 'activation' });
  }
}

/**
 * Registers all extension commands
 */
function registerCommands(context: vscode.ExtensionContext): void {
  // Hello World command (example)
  const helloWorldCommand = vscode.commands.registerCommand(
    'advanced-coding-assistant.helloWorld',
    ErrorHandler.wrapAsync(async () => {
      await vscode.window.showInformationMessage('Hello World from Advanced Coding Assistant!');
      TelemetryManager.sendEvent(TelemetryEventType.CommandExecuted, {
        command: 'helloWorld',
      });
    }, 'Failed to execute Hello World command')
  );

  // Show status command
  const showStatusCommand = vscode.commands.registerCommand(
    'advanced-coding-assistant.showStatus',
    ErrorHandler.wrapAsync(async () => {
      const status = statusBarManager?.getStatus() || ConnectionStatus.Disconnected;
      const apiEndpoint = ConfigurationManager.getApiEndpoint();
      const message = `Status: ${status}\nAPI Endpoint: ${apiEndpoint}`;

      const action = await vscode.window.showInformationMessage(message, 'Show Logs', 'Reconnect');

      if (action === 'Show Logs') {
        Logger.show();
      } else if (action === 'Reconnect') {
        await attemptConnection();
      }

      TelemetryManager.sendEvent(TelemetryEventType.CommandExecuted, {
        command: 'showStatus',
      });
    }, 'Failed to show status')
  );

  context.subscriptions.push(helloWorldCommand, showStatusCommand);
}

/**
 * Attempts to connect to the backend
 */
async function attemptConnection(): Promise<void> {
  try {
    const apiEndpoint = ConfigurationManager.getApiEndpoint();
    Logger.info(`Attempting to connect to backend at ${apiEndpoint}`);
    statusBarManager?.updateStatus(ConnectionStatus.Connecting);

    TelemetryManager.sendEvent(TelemetryEventType.ConnectionAttempt, {
      endpoint: apiEndpoint,
    });

    // Simulate connection attempt
    // In a real implementation, this would make an actual HTTP request
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For now, we'll just set it to disconnected since there's no real backend to connect to
    // In a real implementation, this would be based on the actual connection result
    statusBarManager?.updateStatus(ConnectionStatus.Disconnected);
    Logger.info('Backend connection not yet implemented');
  } catch (error) {
    Logger.error('Failed to connect to backend', error);
    statusBarManager?.updateStatus(ConnectionStatus.Error);

    TelemetryManager.sendEvent(TelemetryEventType.ConnectionFailure, {
      error: error instanceof Error ? error.message : String(error),
    });

    await ErrorHandler.handleError(
      error,
      'Failed to connect to the Advanced Coding Assistant backend',
      false
    );
  }
}

// This method is called when your extension is deactivated
export function deactivate(): void {
  Logger.info('Deactivating Advanced Coding Assistant extension');
  TelemetryManager.dispose();
  Logger.dispose();
}
