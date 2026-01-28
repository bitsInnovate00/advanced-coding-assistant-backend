import * as assert from 'assert';
import { StatusBarManager, ConnectionStatus } from '../statusBar';

suite('Status Bar Manager Test Suite', () => {
  let statusBarManager: StatusBarManager;

  setup(() => {
    statusBarManager = new StatusBarManager();
  });

  teardown(() => {
    statusBarManager.dispose();
  });

  test('should initialize with disconnected status', () => {
    const status = statusBarManager.getStatus();
    assert.strictEqual(status, ConnectionStatus.Disconnected);
  });

  test('should update status to connecting', () => {
    statusBarManager.updateStatus(ConnectionStatus.Connecting);
    const status = statusBarManager.getStatus();
    assert.strictEqual(status, ConnectionStatus.Connecting);
  });

  test('should update status to connected', () => {
    statusBarManager.updateStatus(ConnectionStatus.Connected);
    const status = statusBarManager.getStatus();
    assert.strictEqual(status, ConnectionStatus.Connected);
  });

  test('should update status to error', () => {
    statusBarManager.updateStatus(ConnectionStatus.Error);
    const status = statusBarManager.getStatus();
    assert.strictEqual(status, ConnectionStatus.Error);
  });

  test('should update status with custom message', () => {
    assert.doesNotThrow(() => {
      statusBarManager.updateStatus(ConnectionStatus.Connected, 'Custom message');
    });
  });
});
