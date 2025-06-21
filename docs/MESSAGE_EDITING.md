# Message Editing Feature

## Overview

The message editing feature allows users to edit their messages in a conversation. When a message is
edited, the system correctly preserves all messages before the edited message and removes all
messages after it, triggering a new AI response based on the edited content.

## Expected Behavior

Given a conversation with messages: Q1→A1, Q2→A2, Q3→A3

- **Edit Q2** to "Edited Q2"
- **Result**: Q1→A1, "Edited Q2"→[New A2]
- **Deleted**: Original A2, Q3, A3

## Implementation Details

### 1. User Interface

- **Edit Icon**: A pencil icon appears on hover for user messages only
- **Inline Editing**: Clicking the edit icon replaces the message with a textarea
- **Keyboard Shortcuts**:
  - `Enter` to save (Shift+Enter for new line)
  - `Escape` to cancel
- **Visual Indicator**: Edited messages show "(edited)" label

### 2. Edit Logic

```typescript
const handleEditMessage = async (messageId: string, newContent: string) => {
  // Step 1: Get current messages array
  const currentMessages = [...messages];

  // Step 2: Find the index of edited message
  const editIndex = currentMessages.findIndex((m) => m.id === messageId);

  // Step 3: CRITICAL - Keep messages from start to edited message
  const messagesToKeep = currentMessages.slice(0, editIndex + 1);

  // Step 4: Update the content of the edited message
  messagesToKeep[editIndex] = {
    ...messagesToKeep[editIndex],
    content: newContent,
    isEdited: true,
  };

  // Step 5: Update state with kept messages only
  setMessages(messagesToKeep);

  // Step 6: Save to database
  await updateConversationMessages(conversationId, messagesToKeep);

  // Step 7: Trigger new AI response
  append({
    role: 'user',
    content: newContent,
  });
};
```

### 3. Critical Implementation Detail

The key to preserving history correctly is using `slice(0, editIndex + 1)`:

- This keeps all messages from the start up to **and including** the edited message
- Messages after the edited message are removed
- This ensures the conversation context remains intact

### 4. Database Updates

When editing a message:

1. The entire conversation's message array is replaced with the kept messages
2. A transactional update ensures data consistency
3. The edited message is marked with `isEdited: true` metadata
4. Conversation metadata (message count, last message time) is updated

### 5. Components Involved

- **MessageBubble.tsx**: Handles the UI for editing (pencil icon, textarea, save/cancel)
- **ChatArea.tsx**: Contains the `handleEditMessage` logic
- **API Route** (`/api/conversations/[id]/messages`): PUT endpoint for updating messages
- **Message Model**: Already supports `isEdited` field and edit history

## Usage Example

1. User hovers over their message → Edit icon appears
2. User clicks edit icon → Message becomes editable textarea
3. User modifies text and presses Enter → Message is saved
4. System:
   - Preserves all messages before the edit
   - Removes all messages after the edit
   - Saves updated conversation to database
   - Triggers new AI response with edited content

## Technical Considerations

- **Performance**: Uses React state updates efficiently
- **Data Integrity**: MongoDB transactions ensure atomic updates
- **User Experience**: Smooth transitions with proper loading states
- **Accessibility**: Keyboard shortcuts for better UX

## Error Handling

- Invalid message ID: Logs error and returns early
- Database update failures: Logs error but doesn't break the UI
- Network errors: User can retry the edit

## Future Enhancements

- Edit history tracking (already supported by schema)
- Undo/redo functionality
- Collaborative editing indicators
- Batch message editing
