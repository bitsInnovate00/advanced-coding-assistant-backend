/**
 * Type definitions for the Advanced Coding Assistant Backend API
 */

/**
 * Chat completion message role
 */
export type ChatMessageRole = 'system' | 'user' | 'assistant' | 'function';

/**
 * Chat message interface
 */
export interface ChatMessage {
  role: ChatMessageRole;
  content: string;
  name?: string;
}

/**
 * Chat completion request
 */
export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  topP?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  maxTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  logitBias?: Record<string, number>;
  user?: string;
}

/**
 * Chat completion choice
 */
export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finishReason: string;
}

/**
 * Chat completion usage
 */
export interface ChatCompletionUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Chat completion response
 */
export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: ChatCompletionUsage;
}

/**
 * Chat completion streaming chunk
 */
export interface ChatCompletionChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: Partial<ChatMessage>;
    finishReason?: string;
  }>;
}

/**
 * Repository upload response
 */
export interface RepositoryResponse {
  message: string;
  projectId?: string;
  path?: string;
}

/**
 * Conversation metadata
 */
export interface Conversation {
  id: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Conversation message
 */
export interface ConversationMessage {
  role: string;
  content: string;
  timestamp?: string;
}

/**
 * API error response
 */
export interface ApiError {
  error: {
    message: string;
    type?: string;
    code?: string;
  };
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: number;
  version?: string;
}

/**
 * API client configuration
 */
export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  apiKey?: string;
}

/**
 * Request headers
 */
export interface RequestHeaders {
  'Content-Type'?: string;
  Authorization?: string;
  'Persist-Conversation'?: string;
  'Conversation-Id'?: string;
  [key: string]: string | undefined;
}
