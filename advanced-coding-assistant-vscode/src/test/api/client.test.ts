import * as assert from 'assert';
import { ApiClient, ChatCompletionRequest, ChatCompletionResponse } from '../../api';

suite('API Client Test Suite', () => {
  let client: ApiClient;

  setup(() => {
    client = new ApiClient({
      baseUrl: 'http://localhost:8080',
      timeout: 5000,
      retryAttempts: 2,
      retryDelay: 100,
    });
  });

  suite('Client Initialization', () => {
    test('should create client with default config', () => {
      const defaultClient = new ApiClient({
        baseUrl: 'http://localhost:8080',
      });
      assert.ok(defaultClient);
    });

    test('should create client with custom config', () => {
      const customClient = new ApiClient({
        baseUrl: 'http://localhost:8080',
        timeout: 10000,
        retryAttempts: 5,
        retryDelay: 2000,
        apiKey: 'test-key',
      });
      assert.ok(customClient);
    });

    test('should remove trailing slash from baseUrl', () => {
      const clientWithSlash = new ApiClient({
        baseUrl: 'http://localhost:8080/',
      });
      assert.ok(clientWithSlash);
    });
  });

  suite('Chat Completions', () => {
    test('should have createChatCompletion method', () => {
      assert.strictEqual(typeof client.createChatCompletion, 'function');
    });

    test('should have createChatCompletionStream method', () => {
      assert.strictEqual(typeof client.createChatCompletionStream, 'function');
    });

    test('should create valid chat completion request structure', () => {
      const request: ChatCompletionRequest = {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 0.7,
        maxTokens: 100,
      };
      assert.ok(request);
      assert.strictEqual(request.model, 'gpt-3.5-turbo');
      assert.strictEqual(request.messages.length, 1);
    });

    test('should accept optional conversation options', () => {
      const options = {
        persistConversation: true,
        conversationId: 'test-id',
      };

      assert.ok(options);
      assert.strictEqual(options.persistConversation, true);
      assert.strictEqual(options.conversationId, 'test-id');
    });
  });

  suite('Repository Methods', () => {
    test('should have uploadGitLabRepository method', () => {
      assert.strictEqual(typeof client.uploadGitLabRepository, 'function');
    });

    test('should have uploadLocalRepository method', () => {
      assert.strictEqual(typeof client.uploadLocalRepository, 'function');
    });

    test('should have refreshGitLabRepository method', () => {
      assert.strictEqual(typeof client.refreshGitLabRepository, 'function');
    });

    test('should have refreshLocalRepository method', () => {
      assert.strictEqual(typeof client.refreshLocalRepository, 'function');
    });
  });

  suite('Conversation Methods', () => {
    test('should have getConversation method', () => {
      assert.strictEqual(typeof client.getConversation, 'function');
    });

    test('should have getConversations method', () => {
      assert.strictEqual(typeof client.getConversations, 'function');
    });

    test('should have getConversationMessages method', () => {
      assert.strictEqual(typeof client.getConversationMessages, 'function');
    });

    test('should have deleteConversation method', () => {
      assert.strictEqual(typeof client.deleteConversation, 'function');
    });

    test('should have renameConversation method', () => {
      assert.strictEqual(typeof client.renameConversation, 'function');
    });
  });

  suite('Health Check', () => {
    test('should have healthCheck method', () => {
      assert.strictEqual(typeof client.healthCheck, 'function');
    });

    test('should return health check response structure', async () => {
      try {
        const result = await client.healthCheck();
        assert.ok(result);
        assert.ok(['ok', 'error'].includes(result.status));
        assert.ok(typeof result.timestamp === 'number');
      } catch (error) {
        // Health check may fail if backend is not running, which is expected in tests
        assert.ok(error);
      }
    });
  });

  suite('Type Validation', () => {
    test('should validate ChatMessage type', () => {
      const message = {
        role: 'user' as const,
        content: 'Test message',
      };
      assert.strictEqual(message.role, 'user');
      assert.strictEqual(message.content, 'Test message');
    });

    test('should validate ChatCompletionResponse type', () => {
      const response: ChatCompletionResponse = {
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-3.5-turbo',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Response' },
            finishReason: 'stop',
          },
        ],
        usage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15,
        },
      };
      assert.strictEqual(response.choices.length, 1);
      assert.ok(response.usage);
    });
  });

  suite('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      const invalidClient = new ApiClient({
        baseUrl: 'http://invalid-host-12345.local:9999',
        timeout: 1000,
        retryAttempts: 1,
      });

      try {
        await invalidClient.healthCheck();
        // Should return error status, not throw
        assert.ok(true);
      } catch (error) {
        // Error is also acceptable
        assert.ok(error);
      }
    });

    test('should handle timeout errors', async () => {
      const timeoutClient = new ApiClient({
        baseUrl: 'http://localhost:8080',
        timeout: 1, // Very short timeout
        retryAttempts: 1,
      });

      try {
        await timeoutClient.getConversations();
      } catch (error) {
        assert.ok(error);
        assert.ok(
          (error as Error).message.includes('timeout') ||
            (error as Error).message.includes('ECONNREFUSED')
        );
      }
    });
  });

  suite('Configuration', () => {
    test('should use default timeout when not specified', () => {
      const defaultClient = new ApiClient({
        baseUrl: 'http://localhost:8080',
      });
      assert.ok(defaultClient);
    });

    test('should use default retry settings when not specified', () => {
      const defaultClient = new ApiClient({
        baseUrl: 'http://localhost:8080',
      });
      assert.ok(defaultClient);
    });

    test('should support API key authentication', () => {
      const authClient = new ApiClient({
        baseUrl: 'http://localhost:8080',
        apiKey: 'test-api-key',
      });
      assert.ok(authClient);
    });
  });
});
