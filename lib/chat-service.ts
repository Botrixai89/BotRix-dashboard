export interface ChatMessage {
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  conversationId: string;
  warning?: string;
}

export class ChatService {
  private baseUrl: string;
  private botId: string;
  private conversationId: string | null = null;

  constructor(botId: string, baseUrl = '') {
    this.botId = botId;
    this.baseUrl = baseUrl;
  }

  async sendMessage(message: string, userInfo?: any): Promise<ChatResponse> {
    try {
      // Send the message in the format that matches the working bot
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: "text",
          content: {
            text: message
          },
          // Include additional context for the API
          _botId: this.botId,
          _conversationId: this.conversationId,
          _userInfo: userInfo,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Store conversation ID for future messages
      if (data.conversationId) {
        this.conversationId = data.conversationId;
      }

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  getConversationId(): string | null {
    return this.conversationId;
  }

  resetConversation(): void {
    this.conversationId = null;
  }
}

// Utility function for creating a chat widget
export function createChatWidget(botId: string, options: {
  primaryColor?: string;
  position?: 'bottom-right' | 'bottom-left';
  welcomeMessage?: string;
}): HTMLElement {
  const chatService = new ChatService(botId);
  let messages: ChatMessage[] = [];

  // Create widget container
  const widget = document.createElement('div');
  widget.style.cssText = `
    position: fixed;
    ${options.position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
    bottom: 20px;
    width: 350px;
    height: 500px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    z-index: 10000;
    display: none;
    flex-direction: column;
  `;

  // Create header
  const header = document.createElement('div');
  header.style.cssText = `
    background: ${options.primaryColor || '#2563eb'};
    color: white;
    padding: 16px;
    border-radius: 12px 12px 0 0;
    font-weight: 600;
  `;
  header.textContent = 'Chat Support';

  // Create messages container
  const messagesContainer = document.createElement('div');
  messagesContainer.style.cssText = `
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    max-height: 380px;
  `;

  // Add welcome message
  if (options.welcomeMessage) {
    addMessage(options.welcomeMessage, 'bot');
  }

  // Create input container
  const inputContainer = document.createElement('div');
  inputContainer.style.cssText = `
    padding: 16px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    gap: 8px;
  `;

  const input = document.createElement('input');
  input.style.cssText = `
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    outline: none;
  `;
  input.placeholder = 'Type your message...';

  const sendButton = document.createElement('button');
  sendButton.style.cssText = `
    background: ${options.primaryColor || '#2563eb'};
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
  `;
  sendButton.textContent = 'Send';

  function addMessage(content: string, sender: 'user' | 'bot') {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      margin-bottom: 12px;
      display: flex;
      ${sender === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
    `;

    const messageBubble = document.createElement('div');
    messageBubble.style.cssText = `
      max-width: 80%;
      padding: 8px 12px;
      border-radius: 12px;
      ${sender === 'user' 
        ? `background: ${options.primaryColor || '#2563eb'}; color: white;`
        : 'background: #f3f4f6; color: #374151;'
      }
    `;
    messageBubble.textContent = content;

    messageDiv.appendChild(messageBubble);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  async function sendMessage() {
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    input.value = '';
    input.disabled = true;
    sendButton.disabled = true;
    sendButton.textContent = 'Sending...';

    try {
      const response = await chatService.sendMessage(message);
      addMessage(response.response, 'bot');
    } catch (error) {
      addMessage('Sorry, I encountered an error. Please try again.', 'bot');
    } finally {
      input.disabled = false;
      sendButton.disabled = false;
      sendButton.textContent = 'Send';
      input.focus();
    }
  }

  sendButton.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  inputContainer.appendChild(input);
  inputContainer.appendChild(sendButton);
  
  widget.appendChild(header);
  widget.appendChild(messagesContainer);
  widget.appendChild(inputContainer);

  // Create toggle button
  const toggleButton = document.createElement('button');
  toggleButton.style.cssText = `
    position: fixed;
    ${options.position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
    bottom: 20px;
    width: 60px;
    height: 60px;
    background: ${options.primaryColor || '#2563eb'};
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    font-size: 24px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    z-index: 10001;
  `;
  toggleButton.textContent = '💬';

  toggleButton.addEventListener('click', () => {
    if (widget.style.display === 'none') {
      widget.style.display = 'flex';
      toggleButton.style.display = 'none';
      input.focus();
    }
  });

  // Close button
  const closeButton = document.createElement('button');
  closeButton.style.cssText = `
    position: absolute;
    top: 8px;
    right: 8px;
    background: transparent;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  closeButton.textContent = '×';
  closeButton.addEventListener('click', () => {
    widget.style.display = 'none';
    toggleButton.style.display = 'block';
  });

  header.appendChild(closeButton);

  // Add both elements to document
  document.body.appendChild(widget);
  document.body.appendChild(toggleButton);

  return widget;
} 