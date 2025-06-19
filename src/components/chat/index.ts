/**
 * Chat Components Export Barrel
 *
 * This file exports all chat-related components for easy importing.
 * Components in this directory handle:
 * - Chat messages display and formatting
 * - Message input and sending
 * - Chat history and navigation
 * - Real-time message streaming
 * - Message actions (copy, edit, delete)
 */

// Main chat components
export { ChatArea } from './ChatArea';
export { InputArea } from './InputArea';
export { MessageBubble } from './MessageBubble';
export { WelcomeScreen } from './WelcomeScreen';

// TODO: Export additional chat components when they are created
// export { ChatSidebar } from './ChatSidebar';
// export { TypingIndicator } from './TypingIndicator';
// export { ChatHeader } from './ChatHeader';
// export { MessageActions } from './MessageActions';
// export { ModelSelector } from './ModelSelector';
// export { ChatSettings } from './ChatSettings';
// export { ExportChat } from './ExportChat';

/**
 * Available Chat Components:
 *
 * ✅ ChatArea - Main chat interface with message streaming
 * ✅ MessageBubble - Individual message display with actions
 * ✅ InputArea - Message input with auto-resize and send functionality
 * ✅ WelcomeScreen - v0's welcome screen for new conversations
 *
 * TODO: Additional planned components:
 * 5. TypingIndicator - Shows when AI is generating response
 * 6. ChatHeader - Header with chat title and actions
 * 7. MessageActions - Copy, edit, delete message actions
 * 8. ModelSelector - Dropdown to select AI model
 * 9. ChatSettings - Chat-specific settings panel
 * 10. ExportChat - Export chat to various formats
 */
