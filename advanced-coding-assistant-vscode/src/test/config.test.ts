import * as assert from 'assert';
import { ConfigurationManager } from '../config';

suite('Configuration Manager Test Suite', () => {
  test('should get API endpoint with default value', () => {
    const endpoint = ConfigurationManager.getApiEndpoint();
    assert.ok(endpoint);
    assert.strictEqual(typeof endpoint, 'string');
  });

  test('should get telemetry enabled status', () => {
    const enabled = ConfigurationManager.isTelemetryEnabled();
    assert.strictEqual(typeof enabled, 'boolean');
  });

  test('should get log level', () => {
    const logLevel = ConfigurationManager.getLogLevel();
    assert.ok(logLevel);
    assert.strictEqual(typeof logLevel, 'string');
  });

  test('should get auto-connect status', () => {
    const autoConnect = ConfigurationManager.isAutoConnectEnabled();
    assert.strictEqual(typeof autoConnect, 'boolean');
  });
});
