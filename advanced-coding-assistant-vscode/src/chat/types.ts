/**
 * Type definitions for the Chat Participant
 */

/**
 * Context for chat follow-up questions
 */
export interface ChatContext {
  conversationId?: string;
  history: ChatHistoryItem[];
}

/**
 * History item for conversation context
 */
export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/**
 * Code block extracted from response
 */
export interface CodeBlock {
  language: string;
  code: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Source reference for code assistance
 */
export interface SourceReference {
  filePath: string;
  startLine?: number;
  endLine?: number;
  content?: string;
}

/**
 * Chat response metadata
 */
export interface ChatResponseMetadata {
  codeBlocks: CodeBlock[];
  sourceReferences: SourceReference[];
  conversationId?: string;
}
