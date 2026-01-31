import * as assert from 'assert';
import { CHAT_PARTICIPANT_ID } from '../../chat';
import { ChatContext, CodeBlock, SourceReference, FileContext } from '../../chat/types';

suite('Chat Participant Test Suite', () => {
  suite('Constants', () => {
    test('should have correct participant ID', () => {
      assert.strictEqual(CHAT_PARTICIPANT_ID, 'advanced-coding-assistant.aca');
    });
  });

  suite('ChatContext', () => {
    test('should create valid context structure', () => {
      const context: ChatContext = {
        conversationId: 'test-123',
        history: [],
      };
      assert.strictEqual(context.conversationId, 'test-123');
      assert.strictEqual(context.history.length, 0);
    });

    test('should store history items', () => {
      const context: ChatContext = {
        conversationId: 'test-123',
        history: [
          { role: 'user', content: 'Hello', timestamp: Date.now() },
          { role: 'assistant', content: 'Hi!', timestamp: Date.now() },
        ],
      };
      assert.strictEqual(context.history.length, 2);
      assert.strictEqual(context.history[0].role, 'user');
      assert.strictEqual(context.history[1].role, 'assistant');
    });
  });

  suite('CodeBlock', () => {
    test('should create valid code block structure', () => {
      const codeBlock: CodeBlock = {
        language: 'typescript',
        code: 'const x = 1;',
        startIndex: 0,
        endIndex: 20,
      };
      assert.strictEqual(codeBlock.language, 'typescript');
      assert.strictEqual(codeBlock.code, 'const x = 1;');
    });
  });

  suite('SourceReference', () => {
    test('should create valid source reference structure', () => {
      const ref: SourceReference = {
        filePath: '/path/to/file.ts',
        startLine: 10,
        endLine: 20,
      };
      assert.strictEqual(ref.filePath, '/path/to/file.ts');
      assert.strictEqual(ref.startLine, 10);
      assert.strictEqual(ref.endLine, 20);
    });

    test('should allow optional fields', () => {
      const ref: SourceReference = {
        filePath: '/path/to/file.ts',
      };
      assert.strictEqual(ref.filePath, '/path/to/file.ts');
      assert.strictEqual(ref.startLine, undefined);
      assert.strictEqual(ref.endLine, undefined);
    });

    test('should support file:line format reference', () => {
      const ref: SourceReference = {
        filePath: '/path/to/file.ts',
        startLine: 42,
        endLine: 42,
      };
      assert.strictEqual(ref.filePath, '/path/to/file.ts');
      assert.strictEqual(ref.startLine, 42);
      assert.strictEqual(ref.endLine, 42);
    });

    test('should support file:startLine-endLine format reference', () => {
      const ref: SourceReference = {
        filePath: '/path/to/component.tsx',
        startLine: 15,
        endLine: 30,
      };
      assert.strictEqual(ref.filePath, '/path/to/component.tsx');
      assert.strictEqual(ref.startLine, 15);
      assert.strictEqual(ref.endLine, 30);
    });
  });

  suite('FileContext', () => {
    test('should create valid file context with basic info', () => {
      const context: FileContext = {
        fileName: 'src/index.ts',
        languageId: 'typescript',
      };
      assert.strictEqual(context.fileName, 'src/index.ts');
      assert.strictEqual(context.languageId, 'typescript');
      assert.strictEqual(context.workspaceFolder, undefined);
    });

    test('should support workspace folder', () => {
      const context: FileContext = {
        fileName: 'src/index.ts',
        languageId: 'typescript',
        workspaceFolder: 'my-project',
      };
      assert.strictEqual(context.fileName, 'src/index.ts');
      assert.strictEqual(context.workspaceFolder, 'my-project');
    });

    test('should support selected text context', () => {
      const context: FileContext = {
        fileName: 'src/utils.ts',
        languageId: 'typescript',
        selectedText: 'const foo = "bar";',
        selectionStartLine: 10,
        selectionEndLine: 10,
      };
      assert.strictEqual(context.selectedText, 'const foo = "bar";');
      assert.strictEqual(context.selectionStartLine, 10);
      assert.strictEqual(context.selectionEndLine, 10);
    });

    test('should support multi-line selection', () => {
      const context: FileContext = {
        fileName: 'src/component.tsx',
        languageId: 'typescriptreact',
        selectedText: 'function Component() {\n  return <div>Hello</div>;\n}',
        selectionStartLine: 5,
        selectionEndLine: 7,
      };
      assert.strictEqual(context.selectionStartLine, 5);
      assert.strictEqual(context.selectionEndLine, 7);
      assert.ok(context.selectedText?.includes('function Component'));
    });

    test('should support visible content context', () => {
      const context: FileContext = {
        fileName: 'src/app.ts',
        languageId: 'typescript',
        visibleContent: '// Top of file\nimport foo from "bar";',
        visibleStartLine: 1,
        visibleEndLine: 50,
      };
      assert.strictEqual(context.visibleStartLine, 1);
      assert.strictEqual(context.visibleEndLine, 50);
      assert.ok(context.visibleContent?.includes('import foo'));
    });

    test('should support all context fields together', () => {
      const context: FileContext = {
        fileName: 'src/main.ts',
        languageId: 'typescript',
        workspaceFolder: 'my-app',
        selectedText: 'console.log("test");',
        selectionStartLine: 15,
        selectionEndLine: 15,
        visibleContent: '// Full visible content here',
        visibleStartLine: 10,
        visibleEndLine: 60,
      };
      assert.strictEqual(context.fileName, 'src/main.ts');
      assert.strictEqual(context.workspaceFolder, 'my-app');
      assert.strictEqual(context.selectedText, 'console.log("test");');
      assert.strictEqual(context.selectionStartLine, 15);
    });
  });
});
