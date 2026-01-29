// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ConfigurationManager } from './config';
import { Logger } from './logger';
import { StatusBarManager, ConnectionStatus } from './statusBar';
import { ErrorHandler } from './errorHandler';
import { TelemetryManager, TelemetryEventType } from './telemetry';
import { ApiClient } from './api';

let statusBarManager: StatusBarManager | undefined;
let apiClient: ApiClient | undefined;

/**
 * Gets the API client instance
 * @returns The API client instance or undefined if not initialized
 */
export function getApiClient(): ApiClient | undefined {
  return apiClient;
}

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

    // Initialize API client
    const apiEndpoint = ConfigurationManager.getApiEndpoint();
    apiClient = new ApiClient({
      baseUrl: apiEndpoint,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
    });

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

    // Perform health check using API client
    if (!apiClient) {
      throw new Error('API client not initialized');
    }

    const healthResult = await apiClient.healthCheck();

    if (healthResult.status === 'ok') {
      statusBarManager?.updateStatus(ConnectionStatus.Connected);
      Logger.info(`Successfully connected to backend at ${apiEndpoint}`);
      
      TelemetryManager.sendEvent(TelemetryEventType.ConnectionSuccess, {
        endpoint: apiEndpoint,
      });
    } else {
      statusBarManager?.updateStatus(ConnectionStatus.Disconnected);
      Logger.warn(`Backend at ${apiEndpoint} is not responding properly`);
    }
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
