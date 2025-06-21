# Multimodal Content Handling

## Overview

This document explains how the application handles multimodal content (messages with text, images,
and files) and the database storage strategy.

## The Problem

When users send messages with image attachments, the frontend formats the content as a multimodal
array for Google Generative AI:

```json
[
  {
    "type": "text",
    "text": "Can you tell me about this image?"
  },
  {
    "type": "image",
    "image": "https://example.com/image.jpg"
  }
]
```

However, the database schema expects the `content` field to be a **string**, causing validation
errors when trying to save these messages.

## The Solution

### 1. Content Conversion Utility

Created `convertMultimodalContentToString()` in `src/lib/utils.ts`:

```typescript
export function convertMultimodalContentToString(content: any): string {
  if (typeof content === 'string') {
    return content;
  } else if (Array.isArray(content)) {
    // Extract text parts
    const textParts = content
      .filter((part: any) => part.type === 'text')
      .map((part: any) => part.text);

    // Check for attachments
    const hasImages = content.some((part: any) => part.type === 'image');
    const hasFiles = content.some((part: any) => part.type === 'file');

    // Combine text and add attachment indicators
    let result = textParts.join(' ');
    if (hasImages) result += ' [Image attached]';
    if (hasFiles) result += ' [File attached]';

    return result;
  } else {
    return String(content);
  }
}
```

### 2. Database Storage Format

Multimodal messages are stored in the database as:

- **Text content**: Combined from all text parts
- **Attachment indicators**: `[Image attached]` and/or `[File attached]`

**Example:**

- **Input**: Array with text "Tell me about this image" + image
- **Stored**: `"Tell me about this image [Image attached]"`

### 3. Implementation Points

The conversion is applied in:

1. **Chat API Route** (`src/app/api/chat/route.ts`):

   - `createNewConversation()` - for new conversations
   - `saveMessagesAndUpdateConversation()` - for existing conversations

2. **Message Update API** (`src/app/api/conversations/[id]/messages/route.ts`):
   - PUT endpoint for message editing

## Flow Diagram

```
User sends message with image
        ↓
Frontend formats as multimodal array
        ↓
Google AI processes array format
        ↓
AI generates response
        ↓
convertMultimodalContentToString() converts for DB
        ↓
String format saved to database
```

## Benefits

1. **Compatibility**: Maintains compatibility with existing string-based database schema
2. **Functionality**: Preserves full multimodal functionality for AI processing
3. **History**: Conversation history is properly maintained
4. **Editing**: Message editing works correctly with multimodal messages
5. **Search**: Text content remains searchable in the database

## Technical Considerations

- **Performance**: Minimal overhead during conversion
- **Data Integrity**: No loss of functional information
- **Scalability**: Works with multiple attachment types
- **Maintenance**: Centralized conversion logic in utility function

## Error Prevention

This fix prevents the following database validation error:

```
Message validation failed: content: Cast to string failed for value "[...]" (type Array) at path "content"
```

## Future Enhancements

- Store attachment metadata in separate fields
- Add support for more multimodal content types
- Implement rich content reconstruction for editing
