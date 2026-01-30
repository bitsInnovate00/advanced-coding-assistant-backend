import * as https from 'https';
import * as http from 'http';
import {
  ApiClientConfig,
  ApiError,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  Conversation,
  ConversationMessage,
  HealthCheckResponse,
  RequestHeaders,
  RepositoryResponse,
} from './types';

/**
 * HTTP client for the Advanced Coding Assistant Backend API
 * Provides support for OpenAI-compatible endpoints and custom endpoints
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retryAttempts: number;
  private readonly retryDelay: number;
  private readonly apiKey?: string;

  /**
   * Creates a new API client instance
   * @param config - Configuration for the API client
   */
  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.timeout ?? 30000; // Default 30 seconds
    this.retryAttempts = config.retryAttempts ?? 3;
    this.retryDelay = config.retryDelay ?? 1000; // Default 1 second
    this.apiKey = config.apiKey;
  }

  /**
   * Creates a chat completion (OpenAI-compatible endpoint)
   * @param request - The chat completion request
   * @param options - Optional headers (conversation persistence, etc.)
   * @returns Promise with the chat completion response and conversation ID
   */
  public async createChatCompletion(
    request: ChatCompletionRequest,
    options?: {
      persistConversation?: boolean;
      conversationId?: string;
    }
  ): Promise<{ response: ChatCompletionResponse; conversationId?: string }> {
    const headers: RequestHeaders = {
      'Content-Type': 'application/json',
    };

    if (options?.persistConversation) {
      headers['Persist-Conversation'] = 'true';
    }

    if (options?.conversationId) {
      headers['Conversation-Id'] = options.conversationId;
    }

    const result = await this.request<ChatCompletionResponse>(
      'POST',
      '/v1/chat/completions',
      request,
      headers
    );

    return {
      response: result.data,
      conversationId: result.headers['conversation-id'],
    };
  }

  /**
   * Creates a streaming chat completion
   * @param request - The chat completion request
   * @param onChunk - Callback for each chunk received
   * @param options - Optional headers (conversation persistence, etc.)
   * @returns Promise that resolves when streaming is complete
   */
  public async createChatCompletionStream(
    request: ChatCompletionRequest,
    onChunk: (chunk: ChatCompletionChunk) => void,
    options?: {
      persistConversation?: boolean;
      conversationId?: string;
    }
  ): Promise<{ conversationId?: string }> {
    const headers: RequestHeaders = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };

    if (options?.persistConversation) {
      headers['Persist-Conversation'] = 'true';
    }

    if (options?.conversationId) {
      headers['Conversation-Id'] = options.conversationId;
    }

    // Set stream to true
    const streamRequest = { ...request, stream: true };

    return new Promise((resolve, reject) => {
      const url = new URL(`${this.baseUrl}/v1/chat/completions`);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      const options = {
        method: 'POST',
        headers: this.buildHeaders(headers),
        timeout: this.timeout,
      };

      const req = httpModule.request(url, options, res => {
        let conversationId: string | undefined;

        // Extract conversation ID from headers
        if (res.headers['conversation-id']) {
          conversationId = res.headers['conversation-id'] as string;
        }

        res.setEncoding('utf8');

        let buffer = '';

        res.on('data', (chunk: string) => {
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                continue;
              }
              try {
                const parsed = JSON.parse(data) as ChatCompletionChunk;
                onChunk(parsed);
              } catch (error) {
                // Skip invalid JSON
              }
            }
          }
        });

        res.on('end', () => {
          resolve({ conversationId });
        });

        res.on('error', error => {
          reject(this.createError('Stream error', error.message));
        });
      });

      req.on('error', error => {
        reject(this.createError('Request failed', error.message));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(this.createError('Request timeout', 'Request timed out'));
      });

      req.write(JSON.stringify(streamRequest));
      req.end();
    });
  }

  /**
   * Uploads a GitLab repository
   * @param projectId - The GitLab project ID
   * @returns Promise with the upload response
   */
  public async uploadGitLabRepository(projectId: string): Promise<RepositoryResponse> {
    const result = await this.request<string>(
      'POST',
      `/v1/repositories/gitlab/${projectId}`,
      undefined,
      { 'Content-Type': 'application/json' }
    );
    return { message: result.data, projectId };
  }

  /**
   * Uploads a local repository
   * @param localPath - The local path of the repository
   * @returns Promise with the upload response
   */
  public async uploadLocalRepository(localPath: string): Promise<RepositoryResponse> {
    const result = await this.request<string>('POST', '/v1/repositories/local', localPath, {
      'Content-Type': 'text/plain',
    });
    return { message: result.data, path: localPath };
  }

  /**
   * Refreshes a GitLab repository
   * @param projectId - The GitLab project ID
   * @returns Promise with the refresh response
   */
  public async refreshGitLabRepository(projectId: string): Promise<RepositoryResponse> {
    const result = await this.request<string>(
      'PUT',
      `/v1/repositories/gitlab/${projectId}/refresh`,
      undefined,
      { 'Content-Type': 'application/json' }
    );
    return { message: result.data, projectId };
  }

  /**
   * Refreshes a local repository
   * @param localPath - The local path of the repository
   * @returns Promise with the refresh response
   */
  public async refreshLocalRepository(localPath: string): Promise<RepositoryResponse> {
    const result = await this.request<string>('PUT', '/v1/repositories/local/refresh', localPath, {
      'Content-Type': 'text/plain',
    });
    return { message: result.data, path: localPath };
  }

  /**
   * Gets a conversation by ID
   * @param conversationId - The conversation ID
   * @returns Promise with the conversation metadata
   */
  public async getConversation(conversationId: string): Promise<Conversation> {
    const result = await this.request<Record<string, string>>(
      'GET',
      `/v1/conversations/${conversationId}`
    );
    return this.mapConversation(result.data);
  }

  /**
   * Gets all conversations
   * @returns Promise with the list of conversations
   */
  public async getConversations(): Promise<Conversation[]> {
    const result = await this.request<Array<Record<string, string>>>('GET', '/v1/conversations');
    return result.data.map(conv => this.mapConversation(conv));
  }

  /**
   * Gets messages for a conversation
   * @param conversationId - The conversation ID
   * @returns Promise with the conversation messages
   */
  public async getConversationMessages(conversationId: string): Promise<ConversationMessage[]> {
    const result = await this.request<Array<Record<string, string>>>(
      'GET',
      `/v1/conversations/${conversationId}/messages`
    );
    return result.data.map(msg => ({
      role: msg.role || '',
      content: msg.content || '',
      timestamp: msg.timestamp,
    }));
  }

  /**
   * Deletes a conversation
   * @param conversationId - The conversation ID
   * @returns Promise that resolves when the conversation is deleted
   */
  public async deleteConversation(conversationId: string): Promise<void> {
    await this.request<void>('DELETE', `/v1/conversations/${conversationId}`);
  }

  /**
   * Renames a conversation
   * @param conversationId - The conversation ID
   * @param newTitle - The new title
   * @returns Promise with the updated title
   */
  public async renameConversation(conversationId: string, newTitle: string): Promise<string> {
    const result = await this.request<string>(
      'PATCH',
      `/v1/conversations/${conversationId}/rename?newTitle=${encodeURIComponent(newTitle)}`
    );
    return result.data;
  }

  /**
   * Performs a health check on the backend
   * @returns Promise with the health check response
   */
  public async healthCheck(): Promise<HealthCheckResponse> {
    try {
      await this.request<void>('GET', '/actuator/health', undefined, undefined, false);
      return {
        status: 'ok',
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Makes an HTTP request with retry logic
   * @param method - HTTP method
   * @param path - Request path
   * @param body - Request body
   * @param headers - Request headers
   * @param retry - Whether to retry on failure
   * @returns Promise with the response
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    headers?: RequestHeaders,
    retry = true
  ): Promise<{ data: T; headers: Record<string, string> }> {
    let lastError: Error | undefined;

    const attempts = retry ? this.retryAttempts : 1;

    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        return await this.executeRequest<T>(method, path, body, headers);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (this.isClientError(error)) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < attempts - 1) {
          await this.sleep(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError;
  }

  /**
   * Executes an HTTP request
   * @param method - HTTP method
   * @param path - Request path
   * @param body - Request body
   * @param headers - Request headers
   * @returns Promise with the response
   */
  private executeRequest<T>(
    method: string,
    path: string,
    body?: unknown,
    headers?: RequestHeaders
  ): Promise<{ data: T; headers: Record<string, string> }> {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.baseUrl}${path}`);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      const options = {
        method,
        headers: this.buildHeaders(headers),
        timeout: this.timeout,
      };

      const req = httpModule.request(url, options, res => {
        let data = '';

        res.setEncoding('utf8');
        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          const responseHeaders: Record<string, string> = {};
          for (const [key, value] of Object.entries(res.headers)) {
            if (typeof value === 'string') {
              responseHeaders[key] = value;
            }
          }

          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = data ? JSON.parse(data) : undefined;
              resolve({ data: parsed, headers: responseHeaders });
            } catch (error) {
              // If response is not JSON, return as string
              resolve({ data: data as T, headers: responseHeaders });
            }
          } else {
            try {
              const errorData = JSON.parse(data) as ApiError;
              reject(
                this.createError(
                  errorData.error.message,
                  `Status: ${res.statusCode}`,
                  res.statusCode
                )
              );
            } catch {
              reject(
                this.createError(`HTTP ${res.statusCode}`, data || 'Unknown error', res.statusCode)
              );
            }
          }
        });
      });

      req.on('error', error => {
        reject(this.createError('Request failed', error.message));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(this.createError('Request timeout', 'Request timed out'));
      });

      if (body !== undefined) {
        const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
        req.write(bodyStr);
      }

      req.end();
    });
  }

  /**
   * Builds request headers
   * @param customHeaders - Custom headers to include
   * @returns Combined headers object
   */
  private buildHeaders(customHeaders?: RequestHeaders): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'Advanced-Coding-Assistant-VSCode/0.0.1',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    if (customHeaders) {
      for (const [key, value] of Object.entries(customHeaders)) {
        if (value !== undefined) {
          headers[key] = value;
        }
      }
    }

    return headers;
  }

  /**
   * Maps a conversation object from the API response
   * @param data - Raw conversation data
   * @returns Mapped conversation object
   */
  private mapConversation(data: Record<string, string>): Conversation {
    return {
      id: data.id || '',
      title: data.title,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  /**
   * Creates a standardized error
   * @param message - Error message
   * @param detail - Error detail
   * @param statusCode - HTTP status code
   * @returns Error object
   */
  private createError(message: string, detail?: string, statusCode?: number): Error {
    const error = new Error(`${message}${detail ? ': ' + detail : ''}`);
    (error as Error & { statusCode?: number }).statusCode = statusCode;
    return error;
  }

  /**
   * Checks if an error is a client error (4xx)
   * @param error - Error object
   * @returns True if client error
   */
  private isClientError(error: unknown): boolean {
    const statusCode = (error as Error & { statusCode?: number }).statusCode;
    return statusCode !== undefined && statusCode >= 400 && statusCode < 500;
  }

  /**
   * Sleep for a specified duration
   * @param ms - Duration in milliseconds
   * @returns Promise that resolves after the duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
