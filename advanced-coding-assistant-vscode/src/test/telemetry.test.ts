import * as assert from 'assert';
import { TelemetryManager, TelemetryEventType } from '../telemetry';

suite('Telemetry Manager Test Suite', () => {
  test('should initialize telemetry', () => {
    assert.doesNotThrow(() => {
      TelemetryManager.initialize();
    });
  });

  test('should send telemetry event', () => {
    TelemetryManager.initialize();
    assert.doesNotThrow(() => {
      TelemetryManager.sendEvent(TelemetryEventType.CommandExecuted, {
        command: 'test',
      });
    });
  });

  test('should send error event', () => {
    TelemetryManager.initialize();
    assert.doesNotThrow(() => {
      TelemetryManager.sendError(new Error('Test error'), {
        context: 'test',
      });
    });
  });

  test('should dispose telemetry', () => {
    TelemetryManager.initialize();
    assert.doesNotThrow(() => {
      TelemetryManager.dispose();
    });
  });
});
