import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension should be present', () => {
    const extension = vscode.extensions.getExtension(
      'undefined_publisher.advanced-coding-assistant'
    );
    assert.ok(extension);
  });

  test('Extension should activate', async () => {
    const extension = vscode.extensions.getExtension(
      'undefined_publisher.advanced-coding-assistant'
    );
    if (extension) {
      await extension.activate();
      assert.ok(extension.isActive);
    }
  });

  test('Hello World command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('advanced-coding-assistant.helloWorld'),
      'Hello World command not found'
    );
  });

  test('Show Status command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('advanced-coding-assistant.showStatus'),
      'Show Status command not found'
    );
  });
});
