import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension should be present', () => {
    const extension = vscode.extensions.getExtension(
      'bitsInnovate00.advanced-coding-assistant'
    );
    assert.ok(extension);
  });

  test('Extension should activate', async () => {
    const extension = vscode.extensions.getExtension(
      'bitsInnovate00.advanced-coding-assistant'
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

  test('Refresh Repositories command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('advanced-coding-assistant.refreshRepositories'),
      'Refresh Repositories command not found'
    );
  });

  test('Index Repository command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('advanced-coding-assistant.indexRepository'),
      'Index Repository command not found'
    );
  });

  test('Re-index Repository command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('advanced-coding-assistant.reindexRepository'),
      'Re-index Repository command not found'
    );
  });

  test('Delete Repository Index command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('advanced-coding-assistant.deleteRepositoryIndex'),
      'Delete Repository Index command not found'
    );
  });

  test('Index All Repositories command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('advanced-coding-assistant.indexAllRepositories'),
      'Index All Repositories command not found'
    );
  });
});
