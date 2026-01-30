import * as vscode from 'vscode';
import { Logger } from '../logger';
import { ErrorHandler } from '../errorHandler';
import { TelemetryManager, TelemetryEventType } from '../telemetry';
import { ConfigurationManager } from '../config';
import { ApiClient } from '../api';
import { ChatMessage } from '../api/types';
import { CodeBlock, SourceReference } from './types';

/**
 * Chat participant ID
 */
export const CHAT_PARTICIPANT_ID = 'advanced-coding-assistant.aca';

/**
 * Chat participant for the Advanced Coding Assistant
 * Provides a conversational interface for code assistance through GitHub Copilot Chat
 */
export class ChatParticipant {
  private readonly participant: vscode.ChatParticipant;
  private readonly apiClientGetter: () => ApiClient | undefined;
  private readonly conversationIds: Map<string, string> = new Map();

  /**
   * Creates a new ChatParticipant instance
   * @param apiClientGetter - Function to get the API client instance
   */
  constructor(apiClientGetter: () => ApiClient | undefined) {
    this.apiClientGetter = apiClientGetter;

    // Register the chat participant
    this.participant = vscode.chat.createChatParticipant(
      CHAT_PARTICIPANT_ID,
      this.handleRequest.bind(this)
    );

    // Set participant properties
    this.participant.iconPath = new vscode.ThemeIcon('hubot');

    // Set up follow-up provider
    this.participant.followupProvider = {
      provideFollowups: this.provideFollowups.bind(this),
    };

    Logger.info('Chat participant @aca registered successfully');
  }

  /**
   * Handles incoming chat requests
   * @param request - The chat request from the user
   * @param context - The chat context
   * @param stream - The response stream for sending messages
   * @param token - Cancellation token
   */
  private async handleRequest(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<vscode.ChatResult> {
    const apiClient = this.apiClientGetter();

    if (!apiClient) {
      stream.markdown(
        '⚠️ **Error:** The Advanced Coding Assistant backend is not connected. Please check your connection settings.'
      );
      return { metadata: { error: 'Backend not connected' } };
    }

    try {
      // Show progress indicator
      stream.progress('Thinking...');

      // Get session ID and any existing conversation ID
      const sessionId = this.getSessionId(context);
      const conversationId = this.conversationIds.get(sessionId);

      // Build messages array with history from VS Code context
      const messages = this.buildMessages(request.prompt, context);

      // Track telemetry
      TelemetryManager.sendEvent(TelemetryEventType.CommandExecuted, {
        command: 'chatParticipant.request',
        hasHistory: context.history.length > 0,
      });

      // Stream the response with cancellation support
      let fullResponse = '';
      const codeBlocks: CodeBlock[] = [];
      const sourceReferences: SourceReference[] = [];
      let cancelled = false;

      // Register cancellation handler
      token.onCancellationRequested(() => {
        cancelled = true;
      });

      // Get model from configuration or use default
      const model = ConfigurationManager.getChatModel();

      const result = await apiClient.createChatCompletionStream(
        {
          model,
          messages,
          stream: true,
        },
        chunk => {
          if (cancelled) {
            return;
          }

          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            fullResponse += content;
            stream.markdown(content);
          }
        },
        {
          persistConversation: true,
          conversationId,
        }
      );

      // Store conversation ID for future requests in this session
      if (result.conversationId) {
        this.conversationIds.set(sessionId, result.conversationId);
      }

      // Skip post-processing if cancelled
      if (cancelled) {
        return { metadata: { cancelled: true } };
      }

      // Extract code blocks for apply buttons
      this.extractCodeBlocks(fullResponse, codeBlocks);

      // Extract source references (only existing files)
      await this.extractSourceReferences(fullResponse, sourceReferences);

      // Add apply code buttons for each code block
      for (const codeBlock of codeBlocks) {
        if (codeBlock.code.trim().length > 0) {
          stream.button({
            command: 'advanced-coding-assistant.applyCode',
            title: `$(code) Apply ${codeBlock.language || 'code'}`,
            arguments: [codeBlock.code, codeBlock.language],
          });
        }
      }

      // Add source references
      for (const ref of sourceReferences) {
        if (ref.filePath) {
          stream.reference(vscode.Uri.file(ref.filePath));
        }
      }

      return {
        metadata: {
          codeBlocks,
          sourceReferences,
          conversationId: result.conversationId,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error('Chat request failed', error);

      // Show error message with retry option
      stream.markdown(`\n\n⚠️ **Error:** ${errorMessage}`);
      stream.button({
        command: 'advanced-coding-assistant.showStatus',
        title: '$(debug-restart) Check Connection',
      });

      TelemetryManager.sendError(error, { context: 'chatParticipant.request' });

      return { metadata: { error: errorMessage } };
    }
  }

  /**
   * Provides follow-up suggestions based on the chat result
   * @param result - The result of the previous chat request
   * @param _context - The chat context (unused but required by API)
   * @param _token - Cancellation token (unused but required by API)
   */
  private async provideFollowups(
    result: vscode.ChatResult,
    _context: vscode.ChatContext,
    _token: vscode.CancellationToken
  ): Promise<vscode.ChatFollowup[]> {
    const followups: vscode.ChatFollowup[] = [];

    // Check if there were code blocks in the response
    const metadata = result.metadata as { codeBlocks?: CodeBlock[] } | undefined;
    if (metadata?.codeBlocks && metadata.codeBlocks.length > 0) {
      followups.push({
        prompt: 'Can you explain this code in more detail?',
        label: 'Explain code',
        participant: CHAT_PARTICIPANT_ID,
      });

      followups.push({
        prompt: 'How can I improve this code?',
        label: 'Improve code',
        participant: CHAT_PARTICIPANT_ID,
      });

      followups.push({
        prompt: 'Can you add error handling to this code?',
        label: 'Add error handling',
        participant: CHAT_PARTICIPANT_ID,
      });
    }

    // General follow-ups
    followups.push({
      prompt: 'Can you provide more examples?',
      label: 'More examples',
      participant: CHAT_PARTICIPANT_ID,
    });

    return followups;
  }

  /**
   * Gets a session ID from the chat context using a hash of the first history item
   * This ensures each unique conversation gets its own session
   * @param context - The VS Code chat context
   */
  private getSessionId(context: vscode.ChatContext): string {
    // If there's history, use the first request's prompt to create a unique session ID
    // This ensures conversations with different starting points have different sessions
    if (context.history.length > 0) {
      const firstTurn = context.history[0];
      if (firstTurn instanceof vscode.ChatRequestTurn) {
        // Create a simple hash from the first prompt and timestamp-like identifier
        return `session-${this.simpleHash(firstTurn.prompt)}`;
      }
    }
    // For new conversations, use a timestamp-based ID
    return `session-${Date.now()}`;
  }

  /**
   * Creates a simple hash from a string for session identification
   * @param str - The string to hash
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Builds the messages array for the API request
   * @param prompt - The user's prompt
   * @param vscodeContext - The VS Code chat context
   */
  private buildMessages(prompt: string, vscodeContext: vscode.ChatContext): ChatMessage[] {
    const messages: ChatMessage[] = [];

    // Add system message
    messages.push({
      role: 'system',
      content:
        'You are an advanced coding assistant integrated into VS Code. ' +
        'You help developers with code-related questions, provide explanations, suggest improvements, and write code. ' +
        'When providing code, use proper markdown code blocks with language identifiers. ' +
        'Be concise but thorough in your explanations. ' +
        'If you reference files or code locations, mention the file path clearly.',
    });

    // Add history from VS Code context
    for (const turn of vscodeContext.history) {
      if (turn instanceof vscode.ChatRequestTurn) {
        messages.push({
          role: 'user',
          content: turn.prompt,
        });
      } else if (turn instanceof vscode.ChatResponseTurn) {
        // Extract text content from response
        let responseContent = '';
        for (const part of turn.response) {
          if (part instanceof vscode.ChatResponseMarkdownPart) {
            responseContent += part.value.value;
          }
        }
        if (responseContent) {
          messages.push({
            role: 'assistant',
            content: responseContent,
          });
        }
      }
    }

    // Add current prompt
    messages.push({
      role: 'user',
      content: prompt,
    });

    return messages;
  }

  /**
   * Extracts code blocks from the response
   * @param content - The response content
   * @param codeBlocks - Array to populate with extracted code blocks
   */
  private extractCodeBlocks(content: string, codeBlocks: CodeBlock[]): void {
    // Match code blocks with optional newline after opening backticks
    const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      codeBlocks.push({
        language: match[1] || 'plaintext',
        code: match[2],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  /**
   * Extracts source references from the response, validating against workspace files
   * @param content - The response content
   * @param sourceReferences - Array to populate with extracted references
   */
  private async extractSourceReferences(
    content: string,
    sourceReferences: SourceReference[]
  ): Promise<void> {
    // Look for file paths in the format: file.ext, ./path/file.ext, /path/file.ext
    const filePathRegex = /(?:^|[\s`'"(])([./]?[\w/-]+\.[a-zA-Z]{2,10})(?:[\s`'")\]:,]|$)/gm;
    const seenPaths = new Set<string>();
    const workspaceFolders = vscode.workspace.workspaceFolders;
    let match;

    while ((match = filePathRegex.exec(content)) !== null) {
      const filePath = match[1];

      // Filter out common false positives
      if (
        seenPaths.has(filePath) ||
        filePath.startsWith('http') ||
        filePath.includes('...') ||
        filePath.length < 5 ||
        // Filter out version numbers like 1.2.3
        /^\d+\.\d+(\.\d+)?$/.test(filePath) ||
        // Filter out common non-file patterns
        /^(e\.g|i\.e|etc|vs|no|Mr|Mrs|Dr|St)\./i.test(filePath)
      ) {
        continue;
      }

      // Try to find the file in workspace folders
      if (workspaceFolders) {
        for (const folder of workspaceFolders) {
          const fullPath = vscode.Uri.joinPath(folder.uri, filePath);
          try {
            await vscode.workspace.fs.stat(fullPath);
            // File exists, add as reference
            seenPaths.add(filePath);
            sourceReferences.push({ filePath: fullPath.fsPath });
            break;
          } catch {
            // File doesn't exist in this folder, continue searching
          }
        }
      }
    }
  }

  /**
   * Disposes the chat participant
   */
  public dispose(): void {
    this.participant.dispose();
    this.conversationIds.clear();
    Logger.info('Chat participant disposed');
  }
}

/**
 * Creates and registers the chat participant
 * @param context - The extension context
 * @param apiClientGetter - Function to get the API client instance
 * @returns The created chat participant
 */
export function registerChatParticipant(
  context: vscode.ExtensionContext,
  apiClientGetter: () => ApiClient | undefined
): ChatParticipant {
  const chatParticipant = new ChatParticipant(apiClientGetter);

  // Register apply code command
  const applyCodeCommand = vscode.commands.registerCommand(
    'advanced-coding-assistant.applyCode',
    async (code: string, language: string) => {
      try {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          await editor.edit(editBuilder => {
            if (editor.selection.isEmpty) {
              editBuilder.insert(editor.selection.active, code);
            } else {
              editBuilder.replace(editor.selection, code);
            }
          });

          TelemetryManager.sendEvent(TelemetryEventType.CommandExecuted, {
            command: 'applyCode',
            language,
          });

          await vscode.window.showInformationMessage('Code applied successfully!');
        } else {
          await vscode.window.showWarningMessage(
            'No active editor found. Please open a file first.'
          );
        }
      } catch (error) {
        await ErrorHandler.handleError(error, 'Failed to apply code');
      }
    }
  );

  context.subscriptions.push({ dispose: () => chatParticipant.dispose() }, applyCodeCommand);

  return chatParticipant;
}
