import * as assert from 'assert';
import { Logger } from '../logger';

suite('Logger Test Suite', () => {
  test('should initialize logger', () => {
    Logger.initialize();
    const outputChannel = Logger.getOutputChannel();
    assert.ok(outputChannel);
  });

  test('should log info message', () => {
    Logger.initialize();
    // Just ensure it doesn't throw
    assert.doesNotThrow(() => {
      Logger.info('Test info message');
    });
  });

  test('should log debug message', () => {
    Logger.initialize();
    assert.doesNotThrow(() => {
      Logger.debug('Test debug message');
    });
  });

  test('should log warning message', () => {
    Logger.initialize();
    assert.doesNotThrow(() => {
      Logger.warn('Test warning message');
    });
  });

  test('should log error message', () => {
    Logger.initialize();
    assert.doesNotThrow(() => {
      Logger.error('Test error message', new Error('Test error'));
    });
  });
});
