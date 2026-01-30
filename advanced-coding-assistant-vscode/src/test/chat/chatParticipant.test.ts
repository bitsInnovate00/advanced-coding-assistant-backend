import * as assert from 'assert';
import { CHAT_PARTICIPANT_ID } from '../../chat';
import { ChatContext, CodeBlock, SourceReference } from '../../chat/types';

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
  });
});
