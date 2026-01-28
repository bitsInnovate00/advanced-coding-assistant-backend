import { ConfigurationManager } from './config';
import { Logger } from './logger';

/**
 * Telemetry event types
 */
export enum TelemetryEventType {
  ExtensionActivated = 'extension.activated',
  ExtensionDeactivated = 'extension.deactivated',
  CommandExecuted = 'command.executed',
  ConnectionAttempt = 'connection.attempt',
  ConnectionSuccess = 'connection.success',
  ConnectionFailure = 'connection.failure',
  Error = 'error.occurred',
}

/**
 * Telemetry data interface
 */
export interface TelemetryData {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Telemetry manager for the Advanced Coding Assistant extension
 */
export class TelemetryManager {
  private static isInitialized = false;

  /**
   * Initializes the telemetry manager
   */
  public static initialize(): void {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;

    if (ConfigurationManager.isTelemetryEnabled()) {
      Logger.info('Telemetry is enabled');
      this.sendEvent(TelemetryEventType.ExtensionActivated, {
        timestamp: Date.now(),
      });
    } else {
      Logger.info('Telemetry is disabled');
    }
  }

  /**
   * Sends a telemetry event
   */
  public static sendEvent(eventType: TelemetryEventType, data?: TelemetryData): void {
    if (!ConfigurationManager.isTelemetryEnabled()) {
      return;
    }

    // In a real implementation, this would send data to a telemetry service
    // For now, we just log it
    Logger.debug(`Telemetry event: ${eventType}`, data || {});
  }

  /**
   * Sends an error event
   */
  public static sendError(error: Error | unknown, additionalData?: TelemetryData): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    this.sendEvent(TelemetryEventType.Error, {
      message: errorMessage,
      stack: errorStack,
      ...additionalData,
    });
  }

  /**
   * Disposes the telemetry manager
   */
  public static dispose(): void {
    if (ConfigurationManager.isTelemetryEnabled()) {
      this.sendEvent(TelemetryEventType.ExtensionDeactivated, {
        timestamp: Date.now(),
      });
    }
    this.isInitialized = false;
  }
}
