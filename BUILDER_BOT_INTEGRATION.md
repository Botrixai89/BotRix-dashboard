# Botrix Builder-Bot Integration

## Overview

This document explains how the Botrix visual flow builder is now fully integrated with the actual bot functionality. Both the embed bot and chat widget test now use the same bot instance, ensuring consistency across all platforms.

## Key Components

### 1. Flow Execution Engine (`lib/flow-executor.ts`)

The flow execution engine processes the visual flow builder data and executes conversation flows in real-time.

**Key Features:**
- Executes nodes based on their type (SEND_MSG, SEND_IMAGE, RCV_INP, PAUSE_NODE, WEBHOOK, CONDITION, WELCOME)
- Supports variable interpolation in messages
- Handles conditional logic and branching
- Processes webhook calls with retry logic
- Prevents infinite loops and circular references

**Node Types:**
- `WELCOME`: Displays welcome messages
- `SEND_MSG`: Sends text messages
- `SEND_IMAGE`: Sends image messages
- `RCV_INP`: Collects user input and stores in variables
- `PAUSE_NODE`: Adds delays to the conversation flow
- `WEBHOOK`: Makes external API calls
- `CONDITION`: Evaluates conditions and branches flow

### 2. Chat API Integration (`app/api/chat/route.ts`)

The chat API now prioritizes flow-based responses over rule-based and webhook responses.

**Execution Priority:**
1. **Flow-based bot** (highest priority) - Uses visual flow builder data
2. **Rule-based bot** - Uses predefined rules
3. **Webhook bot** - Falls back to external webhook calls

**Flow Execution Process:**
```typescript
// Check if flow data exists and is active
if (bot.settings.conversationFlows?.paths?.some((path: any) => path.isActive && path.flowData)) {
  // Execute flow with conversation context
  const flowResult = await flowExecutor.executeFlowPath(bot, message, context);
  
  if (flowResult.success && flowResult.responses.length > 0) {
    // Return all responses from the flow
    return NextResponse.json(responseData, { headers: corsHeaders });
  }
}
```

### 3. Embed Code Generation (`app/api/bots/[id]/embed/route.ts`)

Generates embed code for bots that can be used on any website.

**Generated Embed Code:**
```html
<!-- Botrix Chat Widget -->
<script 
  src="http://localhost:3000/widget.js"
  data-botrix-bot-id="BOT_ID"
  data-botrix-primary-color="#8b5cf6"
  data-botrix-secondary-color="#ec4899"
  data-botrix-position="bottom-right"
  data-botrix-welcome-message="Hello! How can I help you today?"
  data-botrix-enable-voice="true"
  data-botrix-theme="modern"
  data-botrix-demo-mode="false"
></script>
```

### 4. Enhanced Test Widget (`public/test-widget.html`)

The test widget now includes:
- **Embed Code Display**: Shows the generated embed code for the bot
- **Copy Functionality**: One-click copy of embed code
- **Test Embed Button**: Tests the embed code directly on the page
- **Same Bot Instance**: Uses the exact same bot as the embed version

## How It Works

### 1. Flow Builder to Bot Connection

1. **Design Flow**: Users create conversation flows in the visual builder
2. **Save Flow**: Flow data is saved to the bot's `conversationFlows` settings
3. **Execute Flow**: When a user sends a message, the flow executor processes the flow
4. **Return Response**: The bot responds based on the flow logic

### 2. Unified Bot Instance

Both the embed bot and chat widget test use the same bot instance:

```javascript
// Both use the same bot ID and settings
const botId = "YOUR_BOT_ID";
const botSettings = {
  primaryColor: "#8b5cf6",
  welcomeMessage: "Hello! How can I help you today?",
  // ... other settings
};

// Same initialization for both embed and test
window.BotrixChat.createWidget(botId, botSettings);
```

### 3. Real-time Flow Execution

When a user sends a message:

1. **Message Received**: Chat API receives the message
2. **Flow Check**: Checks if bot has active flow data
3. **Flow Execution**: Executes the flow starting from the root node
4. **Node Processing**: Processes each node in the flow path
5. **Response Generation**: Collects all responses from the flow
6. **Return Results**: Returns all responses to the user

## Usage Examples

### 1. Creating a Simple Flow

1. Go to the bot builder (`/dashboard/bots/[id]/builder`)
2. Add nodes to create a conversation flow:
   - Welcome Node: "Hello! How can I help you?"
   - Input Node: "What's your name?"
   - Message Node: "Nice to meet you, {user_name}!"
3. Connect the nodes to create the flow
4. Save the flow
5. Test using the "Test Flow" button

### 2. Embedding on Website

1. Get embed code from `/api/bots/[id]/embed`
2. Copy the generated HTML code
3. Paste into your website's HTML
4. The chat widget appears with your bot's flow

### 3. Testing the Integration

1. Use the test widget (`/test-widget.html?botId=[id]`)
2. Copy the embed code
3. Click "Test Embed" to see it in action
4. Both use the same bot instance and flow

## Technical Details

### Flow Data Structure

```typescript
interface FlowData {
  root: string;                    // Starting node ID
  nodes: Record<string, FlowNode>; // All nodes in the flow
  edges: Record<string, string[]>; // Connections between nodes
}

interface FlowNode {
  node_key: string;
  type: 'SEND_MSG' | 'SEND_IMAGE' | 'RCV_INP' | 'PAUSE_NODE' | 'WEBHOOK' | 'CONDITION' | 'WELCOME';
  node_name: string;
  message?: string;
  prompt?: string;
  variable?: string;
  duration?: number;
  url?: string;
  condition?: string;
  imageUrl?: string;
}
```

### Variable Interpolation

The flow executor supports variable interpolation in messages:

```typescript
// Message: "Hello {user_name}, how can I help you?"
// Variables: { user_name: "John" }
// Result: "Hello John, how can I help you?"
```

### Condition Evaluation

Conditions are evaluated using JavaScript:

```typescript
// Condition: "message.includes('help')"
// Message: "I need help"
// Result: true
```

## Benefits

1. **Consistency**: Same bot behavior across embed and test
2. **Visual Design**: Intuitive drag-and-drop flow builder
3. **Real-time Execution**: Flows execute immediately when saved
4. **Easy Integration**: Simple embed code for any website
5. **Flexible Logic**: Support for conditions, variables, and webhooks
6. **Testing**: Built-in testing tools for flows

## Future Enhancements

1. **Advanced Conditions**: More sophisticated condition evaluation
2. **Flow Templates**: Pre-built flow templates for common use cases
3. **Analytics**: Flow execution analytics and insights
4. **A/B Testing**: Test different flows with users
5. **Multi-language Support**: Internationalization for flows
6. **Advanced Variables**: Complex variable types and operations

## Troubleshooting

### Common Issues

1. **Flow Not Executing**: Check if flow is saved and active
2. **Variables Not Working**: Ensure variable names match exactly
3. **Webhook Failures**: Check webhook URL and response format
4. **Embed Not Working**: Verify embed code is correctly placed

### Debug Tips

1. Check browser console for JavaScript errors
2. Use the "Test Flow" button in the builder
3. Verify bot settings and webhook URLs
4. Check network tab for API calls

## Conclusion

The Botrix builder-bot integration provides a seamless experience for creating, testing, and deploying conversational flows. The visual flow builder makes it easy to design complex conversations, while the unified bot instance ensures consistency across all platforms.
