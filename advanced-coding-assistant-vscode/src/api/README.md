# Advanced Coding Assistant API Client

TypeScript client library for communicating with the Advanced Coding Assistant Backend.

## Features

- ✅ **OpenAI-Compatible Endpoints**: Support for `/v1/chat/completions` with streaming
- ✅ **Custom Endpoints**: Repository and conversation management
- ✅ **Authentication**: Bearer token support
- ✅ **Retry Logic**: Automatic retry with exponential backoff
- ✅ **Timeout Handling**: Configurable request timeouts
- ✅ **Error Parsing**: Standardized error handling
- ✅ **Health Check**: Backend health monitoring

## Installation

The API client is included in the VS Code extension. Import it from `./api`:

```typescript
import { ApiClient } from './api';
```

## Quick Start

### Initialize the Client

```typescript
import { ApiClient } from './api';

const client = new ApiClient({
  baseUrl: 'http://localhost:8080',
  timeout: 30000,      // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000,    // 1 second
  apiKey: 'your-api-key' // optional
});
```

### Chat Completions

#### Non-Streaming

```typescript
const result = await client.createChatCompletion({
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Explain TypeScript generics.' }
  ],
  temperature: 0.7,
  maxTokens: 500
});

console.log(result.response.choices[0].message.content);
console.log('Conversation ID:', result.conversationId);
```

#### Streaming

```typescript
await client.createChatCompletionStream(
  {
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'user', content: 'Write a hello world in Python.' }
    ],
    stream: true
  },
  (chunk) => {
    // Handle each chunk as it arrives
    const delta = chunk.choices[0]?.delta;
    if (delta?.content) {
      process.stdout.write(delta.content);
    }
  },
  {
    persistConversation: true
  }
);
```

#### With Conversation Persistence

```typescript
// First message - creates a conversation
const result1 = await client.createChatCompletion(
  {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'What is TypeScript?' }]
  },
  {
    persistConversation: true
  }
);

const conversationId = result1.conversationId;

// Continue the conversation
const result2 = await client.createChatCompletion(
  {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Give me an example.' }]
  },
  {
    conversationId
  }
);
```

### Repository Management

#### Upload GitLab Repository

```typescript
const result = await client.uploadGitLabRepository('12345');
console.log(result.message);
```

#### Upload Local Repository

```typescript
const result = await client.uploadLocalRepository('/path/to/repo');
console.log(result.message);
```

#### Refresh Repository

```typescript
// Refresh GitLab repository
await client.refreshGitLabRepository('12345');

// Refresh local repository
await client.refreshLocalRepository('/path/to/repo');
```

### Conversation Management

#### List All Conversations

```typescript
const conversations = await client.getConversations();
conversations.forEach(conv => {
  console.log(`${conv.id}: ${conv.title}`);
});
```

#### Get Conversation Details

```typescript
const conversation = await client.getConversation('conv-id');
console.log(conversation);
```

#### Get Conversation Messages

```typescript
const messages = await client.getConversationMessages('conv-id');
messages.forEach(msg => {
  console.log(`${msg.role}: ${msg.content}`);
});
```

#### Rename Conversation

```typescript
const newTitle = await client.renameConversation('conv-id', 'New Title');
console.log('Updated title:', newTitle);
```

#### Delete Conversation

```typescript
await client.deleteConversation('conv-id');
```

### Health Check

```typescript
const health = await client.healthCheck();
if (health.status === 'ok') {
  console.log('Backend is healthy');
} else {
  console.error('Backend is not responding');
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | string | (required) | Base URL of the backend API |
| `timeout` | number | 30000 | Request timeout in milliseconds |
| `retryAttempts` | number | 3 | Number of retry attempts for failed requests |
| `retryDelay` | number | 1000 | Initial delay between retries in milliseconds |
| `apiKey` | string | undefined | Optional API key for authentication |

## Error Handling

The client throws errors for failed requests. All errors include a message and may include a status code:

```typescript
try {
  await client.createChatCompletion(request);
} catch (error) {
  console.error('Error:', error.message);
  if (error.statusCode) {
    console.error('Status code:', error.statusCode);
  }
}
```

## Retry Logic

The client automatically retries failed requests with exponential backoff:
- First retry: after `retryDelay` ms
- Second retry: after `retryDelay * 2` ms
- Third retry: after `retryDelay * 4` ms
- etc.

Client errors (4xx status codes) are not retried.

## Type Definitions

All types are exported from the module:

```typescript
import {
  ApiClient,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatMessage,
  Conversation,
  ConversationMessage,
  HealthCheckResponse,
  // ... other types
} from './api';
```

## Testing

Run the test suite:

```bash
npm test
```

## License

See the main repository LICENSE file.
