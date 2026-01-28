import * as vscode from 'vscode';
import { Logger } from './logger';

/**
 * Error handler for the Advanced Coding Assistant extension
 */
export class ErrorHandler {
  /**
   * Handles an error with user-friendly messaging
   */
  public static async handleError(
    error: Error | unknown,
    userMessage?: string,
    showNotification = true
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const displayMessage = userMessage || `An error occurred: ${errorMessage}`;

    // Log the error
    Logger.error('Error occurred', error);

    // Show user notification if requested
    if (showNotification) {
      const action = await vscode.window.showErrorMessage(displayMessage, 'Show Logs', 'Dismiss');

      if (action === 'Show Logs') {
        Logger.show();
      }
    }
  }

  /**
   * Handles a warning with user-friendly messaging
   */
  public static async handleWarning(message: string, showNotification = true): Promise<void> {
    Logger.warn(message);

    if (showNotification) {
      await vscode.window.showWarningMessage(message);
    }
  }

  /**
   * Handles an info message
   */
  public static async handleInfo(message: string, showNotification = true): Promise<void> {
    Logger.info(message);

    if (showNotification) {
      await vscode.window.showInformationMessage(message);
    }
  }

  /**
   * Wraps an async function with error handling
   */
  public static wrapAsync<T>(
    fn: () => Promise<T>,
    errorMessage?: string
  ): () => Promise<T | undefined> {
    return async () => {
      try {
        return await fn();
      } catch (error) {
        await this.handleError(error, errorMessage);
        return undefined;
      }
    };
  }
}
