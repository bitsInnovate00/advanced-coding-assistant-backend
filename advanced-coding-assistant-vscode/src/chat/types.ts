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

/**
 * Context information from the currently active file in the editor
 */
export interface FileContext {
  /** Relative path to the file from the workspace root */
  fileName: string;
  /** VS Code language identifier (e.g., 'javascript', 'python') */
  languageId: string;
  /** Name of the workspace folder containing this file */
  workspaceFolder?: string;
  /** Selected text content if any */
  selectedText?: string;
  /** Start line of selection (1-indexed) */
  selectionStartLine?: number;
  /** End line of selection (1-indexed) */
  selectionEndLine?: number;
  /** Content currently visible in the editor viewport */
  visibleContent?: string;
  /** Start line of visible range (1-indexed) */
  visibleStartLine?: number;
  /** End line of visible range (1-indexed) */
  visibleEndLine?: number;
}
