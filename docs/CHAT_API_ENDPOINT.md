# Chat API Endpoint Documentation

## Overview

The `/api/chat` endpoint is a fully functional chat API built with the **Vercel AI SDK v4** and
**Groq** provider for ultra-fast AI inference. This endpoint powers the real-time chat functionality
in our ChatGPT clone.

## Features

✅ **Streaming Responses** - Real-time message streaming using Vercel AI SDK  
✅ **Groq Integration** - Ultra-fast inference with multiple model options  
✅ **Authentication** - Secure user verification with Clerk  
✅ **Rate Limiting** - Built-in protection against abuse  
✅ **Input Validation** - Comprehensive request validation with Zod  
✅ **Error Handling** - Detailed error messages and proper HTTP status codes  
✅ **CORS Support** - Cross-origin request handling  
✅ **Logging** - Comprehensive request/response logging  
✅ **Edge Runtime** - Optimized for serverless deployment

## Endpoint Details

### URL

```
POST /api/chat
```

### Authentication

All requests require valid Clerk authentication. The endpoint will return `401 Unauthorized` for
unauthenticated requests.

### Request Format

```typescript
{
  "messages": [
    {
      "role": "user" | "assistant" | "system",
      "content": "string",
      "id": "string" // optional
    }
  ],
  "model": "string", // optional, defaults to llama-3.1-8b-instant
  "conversationId": "string", // optional, generated if not provided
  "temperature": 0.7, // optional, 0-2
  "maxTokens": 2048, // optional, 1-8192
  "stream": true // optional, defaults to true
}
```

### Response Format

The endpoint returns a streaming text response using Server-Sent Events (SSE). Each chunk contains
part of the AI's response.

#### Headers

- `X-Conversation-ID`: The conversation identifier (generated for new conversations)
- `Content-Type`: `text/plain; charset=utf-8`
- `Cache-Control`: `no-cache, no-transform`

#### Streaming Response

```
data: Hello! I'd be happy to help you with that question.

data:  Let me break this down for you:

data:

1. **REST APIs** are...

data: [DONE]
```

## Available Models

The endpoint supports multiple Groq models optimized for different use cases:

### Fast Models (Recommended for Chat)

- `llama-3.1-8b-instant` - Ultra-fast responses, great for chat
- `llama-3.3-70b-versatile` - Balanced performance and quality

### Specialized Models

- `qwen-qwq-32b` - Advanced reasoning capabilities
- `mixtral-8x7b-32768` - Large context window
- `gemma2-9b-it` - Instruction-tuned for conversations

## Rate Limiting

- **30 requests per minute** per authenticated user
- Rate limits reset every 60 seconds
- Exceeded limits return `429 Too Many Requests`

## Validation Rules

### Messages Array

- Minimum 1 message, maximum 50 messages
- Each message content: 1-8000 characters
- Valid roles: `user`, `assistant`, `system`

### Model Parameters

- `temperature`: 0.0 - 2.0 (controls randomness)
- `maxTokens`: 1 - 8192 (response length limit)

## Error Handling

### HTTP Status Codes

| Code | Description           | Common Causes                     |
| ---- | --------------------- | --------------------------------- |
| 200  | Success               | Request processed successfully    |
| 400  | Bad Request           | Invalid JSON, validation errors   |
| 401  | Unauthorized          | Missing or invalid authentication |
| 429  | Too Many Requests     | Rate limit exceeded               |
| 500  | Internal Server Error | Server-side errors, API issues    |

### Error Response Format

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": [] // Optional validation details
}
```

### Common Error Examples

**Authentication Required**

```json
{
  "error": "Authentication required"
}
```

**Invalid Request Format**

```json
{
  "error": "Invalid request format",
  "details": [
    {
      "field": "messages.0.content",
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

**Rate Limit Exceeded**

```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 30 requests per minute allowed"
}
```

## Usage Examples

### Basic Chat Request

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Explain quantum computing in simple terms"
      }
    ]
  }'
```

### Advanced Request with Custom Parameters

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Write a Python function to calculate fibonacci numbers"
      }
    ],
    "model": "llama-3.3-70b-versatile",
    "temperature": 0.3,
    "maxTokens": 1500,
    "conversationId": "conv_123456"
  }'
```

### JavaScript/TypeScript Example

```typescript
const sendChatMessage = async (message: string) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
      model: 'llama-3.1-8b-instant',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Chat request failed');
  }

  // Handle streaming response
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      console.log('Received:', chunk);
    }
  }
};
```

## Integration with Vercel AI SDK

The endpoint is designed to work seamlessly with the Vercel AI SDK's `useChat` hook:

```typescript
import { useChat } from 'ai/react';

function ChatComponent() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    headers: {
      'X-Conversation-ID': conversationId,
    }
  });

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>
          <strong>{message.role}:</strong> {message.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </div>
  );
}
```

## Environment Configuration

Required environment variables:

```bash
# Required
GROQ_API_KEY=your_groq_api_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional
NODE_ENV=development
```

## Performance Characteristics

### Response Times (typical)

- **llama-3.1-8b-instant**: 50-200ms first token
- **llama-3.3-70b-versatile**: 100-500ms first token
- **Streaming**: ~10-50 tokens per second

### Throughput

- Supports concurrent requests
- Edge Runtime for minimal cold starts
- Optimized for serverless deployment

## Security Considerations

1. **Authentication**: All requests require valid Clerk tokens
2. **Rate Limiting**: Per-user request limits prevent abuse
3. **Input Validation**: Comprehensive sanitization and validation
4. **Content Filtering**: Groq's built-in content moderation
5. **Error Masking**: Generic error messages prevent information leakage

## Monitoring and Logging

The endpoint provides comprehensive logging for:

- Request details (user ID, model, message count)
- Response metrics (tokens, timing, finish reason)
- Error tracking and debugging
- Rate limiting events

## Deployment Notes

### Vercel Deployment

- Uses Edge Runtime for optimal performance
- Automatic scaling based on traffic
- Built-in monitoring and analytics

### Environment Setup

1. Set required environment variables
2. Configure Clerk authentication
3. Obtain Groq API key from console.groq.com
4. Deploy to Vercel or compatible platform

## Testing

Use the provided test script:

```bash
# Show curl examples
node src/app/api/chat/test-endpoint.js curl

# Run automated test (requires running dev server)
node src/app/api/chat/test-endpoint.js test
```

## Future Enhancements

Planned improvements:

- [ ] Database integration for conversation persistence
- [ ] Advanced rate limiting with Redis
- [ ] Function calling and tool usage
- [ ] Multi-modal support (images, audio)
- [ ] Conversation memory and context management
- [ ] User preference-based model selection
- [ ] Advanced analytics and usage tracking

## Troubleshooting

### Common Issues

**"Authentication required" error**

- Ensure Clerk is properly configured
- Check that the user is signed in
- Verify session token is valid

**"Service configuration error"**

- Verify `GROQ_API_KEY` is set in environment
- Check API key is valid and has sufficient credits

**Slow responses**

- Try using `llama-3.1-8b-instant` model
- Reduce `maxTokens` parameter
- Check Groq service status

**Rate limiting issues**

- Implement request queuing in frontend
- Consider upgrading to paid Groq plan
- Add user feedback for rate limiting

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review Groq documentation: https://console.groq.com/docs
3. Check Vercel AI SDK docs: https://sdk.vercel.ai/docs
4. Contact support or create an issue

---

**Last Updated**: January 2025  
**API Version**: 1.0  
**Compatible with**: Vercel AI SDK v4.x, Groq API v1.x
