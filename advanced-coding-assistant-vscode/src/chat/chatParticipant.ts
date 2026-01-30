import * as vscode from 'vscode';
import { Logger } from '../logger';
import { ErrorHandler } from '../errorHandler';
import { TelemetryManager, TelemetryEventType } from '../telemetry';
import { ApiClient } from '../api';
import { ChatMessage } from '../api/types';
import { ChatContext, CodeBlock, SourceReference } from './types';

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
  private readonly contexts: Map<string, ChatContext> = new Map();

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

      // Get or create context for this conversation
      const sessionId = this.getSessionId(context);
      const chatContext = this.getOrCreateContext(sessionId);

      // Build messages array with history
      const messages = this.buildMessages(request.prompt, chatContext, context);

      // Track telemetry
      TelemetryManager.sendEvent(TelemetryEventType.CommandExecuted, {
        command: 'chatParticipant.request',
        hasHistory: chatContext.history.length > 0,
      });

      // Stream the response
      let fullResponse = '';
      const codeBlocks: CodeBlock[] = [];
      const sourceReferences: SourceReference[] = [];

      await apiClient
        .createChatCompletionStream(
          {
            model: 'gpt-4',
            messages,
            stream: true,
          },
          chunk => {
            if (token.isCancellationRequested) {
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
            conversationId: chatContext.conversationId,
          }
        )
        .then(result => {
          if (result.conversationId) {
            chatContext.conversationId = result.conversationId;
          }
        });

      // Extract code blocks for apply buttons
      this.extractCodeBlocks(fullResponse, codeBlocks);

      // Extract source references
      this.extractSourceReferences(fullResponse, sourceReferences);

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

      // Update conversation history
      this.updateHistory(chatContext, request.prompt, fullResponse);

      return {
        metadata: {
          codeBlocks,
          sourceReferences,
          conversationId: chatContext.conversationId,
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
   * Gets or creates a chat context for a session
   * @param sessionId - The session identifier
   */
  private getOrCreateContext(sessionId: string): ChatContext {
    let chatContext = this.contexts.get(sessionId);
    if (!chatContext) {
      chatContext = {
        conversationId: undefined,
        history: [],
      };
      this.contexts.set(sessionId, chatContext);
    }
    return chatContext;
  }

  /**
   * Gets a session ID from the chat context
   * @param context - The VS Code chat context
   */
  private getSessionId(context: vscode.ChatContext): string {
    // Use history length as a simple way to identify sessions
    // In a real implementation, you might want to use a more robust method
    return `session-${context.history.length > 0 ? 'existing' : 'new'}`;
  }

  /**
   * Builds the messages array for the API request
   * @param prompt - The user's prompt
   * @param _chatContext - The chat context with history (reserved for future use)
   * @param vscodeContext - The VS Code chat context
   */
  private buildMessages(
    prompt: string,
    _chatContext: ChatContext,
    vscodeContext: vscode.ChatContext
  ): ChatMessage[] {
    const messages: ChatMessage[] = [];

    // Add system message
    messages.push({
      role: 'system',
      content: `You are an advanced coding assistant integrated into VS Code. 
You help developers with code-related questions, provide explanations, suggest improvements, and write code.
When providing code, use proper markdown code blocks with language identifiers.
Be concise but thorough in your explanations.
If you reference files or code locations, mention the file path clearly.`,
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
   * Updates the conversation history
   * @param chatContext - The chat context to update
   * @param userPrompt - The user's prompt
   * @param assistantResponse - The assistant's response
   */
  private updateHistory(
    chatContext: ChatContext,
    userPrompt: string,
    assistantResponse: string
  ): void {
    const timestamp = Date.now();

    chatContext.history.push({
      role: 'user',
      content: userPrompt,
      timestamp,
    });

    chatContext.history.push({
      role: 'assistant',
      content: assistantResponse,
      timestamp,
    });

    // Limit history to last 20 messages to avoid context overflow
    if (chatContext.history.length > 20) {
      chatContext.history = chatContext.history.slice(-20);
    }
  }

  /**
   * Extracts code blocks from the response
   * @param content - The response content
   * @param codeBlocks - Array to populate with extracted code blocks
   */
  private extractCodeBlocks(content: string, codeBlocks: CodeBlock[]): void {
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
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
   * Extracts source references from the response
   * @param content - The response content
   * @param sourceReferences - Array to populate with extracted references
   */
  private extractSourceReferences(content: string, sourceReferences: SourceReference[]): void {
    // Look for file paths in the format: file.ext, ./path/file.ext, /path/file.ext
    const filePathRegex = /(?:^|[\s`'"(])([./]?[\w/-]+\.[a-zA-Z]{1,10})(?:[\s`'")\]:,]|$)/gm;
    const seenPaths = new Set<string>();
    let match;

    while ((match = filePathRegex.exec(content)) !== null) {
      const filePath = match[1];
      // Filter out common false positives
      if (
        !seenPaths.has(filePath) &&
        !filePath.startsWith('http') &&
        !filePath.includes('...') &&
        filePath.length > 3
      ) {
        seenPaths.add(filePath);
        sourceReferences.push({ filePath });
      }
    }
  }

  /**
   * Disposes the chat participant
   */
  public dispose(): void {
    this.participant.dispose();
    this.contexts.clear();
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
