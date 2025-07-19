(function() {
  'use strict';

  // Chat Service Class
  class ChatService {
    constructor(botId, baseUrl = '') {
      this.botId = botId;
      this.baseUrl = baseUrl || window.location.origin;
      this.conversationId = null;
    }

    async sendMessage(message, userInfo = {}) {
      try {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            botId: this.botId,
            message: message,
            conversationId: this.conversationId,
            format: this.conversationId ? 'existing' : 'new',
            userInfo: {
              ip: 'client-ip',
              userAgent: navigator.userAgent,
              ...userInfo
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Store conversation ID for future messages
        if (Array.isArray(data) && data.length > 0 && data[0]._id) {
          this.conversationId = data[0]._id;
        } else if (data.conversationId) {
          // Fallback for old format
          this.conversationId = data.conversationId;
        }

        // Log response for debugging
        console.log('Chat API response:', data);

        return data;
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    }

    getConversationId() {
      return this.conversationId;
    }

    resetConversation() {
      this.conversationId = null;
    }
  }

  // Chat Widget Class
  class ChatWidget {
    constructor(botId, options = {}) {
      this.botId = botId;
      this.options = {
        primaryColor: '#2563eb',
        position: 'bottom-right',
        welcomeMessage: 'Hello! How can I help you today?',
        baseUrl: '',
        demoMode: false, // Set to true for demo responses
        ...options
      };
      
      this.chatService = new ChatService(botId, this.options.baseUrl);
      this.isOpen = false;
      this.messages = [];
      
      this.init();
    }

    init() {
      this.createStyles();
      this.createWidget();
      this.createToggleButton();
    }

    createStyles() {
      const styles = `
        .botrix-widget {
          position: fixed;
          ${this.options.position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
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
          border: 1px solid #e5e7eb;
        }

        .botrix-widget-header {
          background: ${this.options.primaryColor};
          color: white;
          padding: 16px;
          border-radius: 12px 12px 0 0;
          font-weight: 600;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .botrix-widget-close {
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
          opacity: 0.8;
          transition: opacity 0.2s;
        }

        .botrix-widget-close:hover {
          opacity: 1;
          background: rgba(255,255,255,0.1);
        }

        .botrix-widget-messages {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          max-height: 380px;
        }

        .botrix-widget-input-container {
          padding: 16px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 8px;
        }

        .botrix-widget-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          outline: none;
          font-size: 14px;
        }

        .botrix-widget-input:focus {
          border-color: ${this.options.primaryColor};
          box-shadow: 0 0 0 3px ${this.options.primaryColor}20;
        }

        .botrix-widget-send {
          background: ${this.options.primaryColor};
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          transition: background-color 0.2s;
        }

        .botrix-widget-send:hover {
          background: ${this.options.primaryColor}dd;
        }

        .botrix-widget-send:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .botrix-toggle-button {
          position: fixed;
          ${this.options.position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
          bottom: 20px;
          width: 60px;
          height: 60px;
          background: ${this.options.primaryColor};
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 24px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          z-index: 10001;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .botrix-toggle-button:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }

        .botrix-message {
          margin-bottom: 12px;
          display: flex;
        }

        .botrix-message.user {
          justify-content: flex-end;
        }

        .botrix-message.bot {
          justify-content: flex-start;
        }

        .botrix-message-bubble {
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.4;
          word-wrap: break-word;
        }

        .botrix-message.user .botrix-message-bubble {
          background: ${this.options.primaryColor};
          color: white;
        }

        .botrix-message.bot .botrix-message-bubble {
          background: #f3f4f6;
          color: #374151;
        }

        .botrix-message-time {
          font-size: 10px;
          opacity: 0.6;
          margin-top: 2px;
          text-align: right;
        }

        .botrix-message.bot .botrix-message-time {
          text-align: left;
        }

        .botrix-typing {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          background: #f3f4f6;
          border-radius: 12px;
          max-width: 80px;
        }

        .botrix-typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #9ca3af;
          animation: botrix-typing 1.4s infinite ease-in-out;
        }

        .botrix-typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .botrix-typing-dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes botrix-typing {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @media (max-width: 480px) {
          .botrix-widget {
            width: calc(100vw - 20px);
            height: calc(100vh - 20px);
            bottom: 10px;
            left: 10px !important;
            right: 10px !important;
          }
        }
      `;

      const styleElement = document.createElement('style');
      styleElement.textContent = styles;
      document.head.appendChild(styleElement);
    }

    createWidget() {
      this.widget = document.createElement('div');
      this.widget.className = 'botrix-widget';

      // Header
      const header = document.createElement('div');
      header.className = 'botrix-widget-header';
      header.innerHTML = `
        <span>Chat Support</span>
        <button class="botrix-widget-close">×</button>
      `;

      // Messages container
      this.messagesContainer = document.createElement('div');
      this.messagesContainer.className = 'botrix-widget-messages';

      // Input container
      const inputContainer = document.createElement('div');
      inputContainer.className = 'botrix-widget-input-container';

      this.input = document.createElement('input');
      this.input.className = 'botrix-widget-input';
      this.input.placeholder = 'Type your message...';
      this.input.type = 'text';

      this.sendButton = document.createElement('button');
      this.sendButton.className = 'botrix-widget-send';
      this.sendButton.textContent = 'Send';

      inputContainer.appendChild(this.input);
      inputContainer.appendChild(this.sendButton);

      this.widget.appendChild(header);
      this.widget.appendChild(this.messagesContainer);
      this.widget.appendChild(inputContainer);

      document.body.appendChild(this.widget);

      // Event listeners
      header.querySelector('.botrix-widget-close').addEventListener('click', () => this.close());
      this.sendButton.addEventListener('click', () => this.sendMessage());
      this.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.sendMessage();
        }
      });

      // Add welcome message
      if (this.options.welcomeMessage) {
        this.addMessage(this.options.welcomeMessage, 'bot');
      }
    }

    createToggleButton() {
      this.toggleButton = document.createElement('button');
      this.toggleButton.className = 'botrix-toggle-button';
      this.toggleButton.innerHTML = '💬';

      this.toggleButton.addEventListener('click', () => this.toggle());

      document.body.appendChild(this.toggleButton);
    }

    addMessage(content, sender) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `botrix-message ${sender}`;

      const messageContent = document.createElement('div');
      messageContent.style.cssText = `
        max-width: 80%;
        display: flex;
        flex-direction: column;
      `;

      const bubble = document.createElement('div');
      bubble.className = 'botrix-message-bubble';
      bubble.textContent = content;

      const time = document.createElement('div');
      time.className = 'botrix-message-time';
      time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      messageContent.appendChild(bubble);
      messageContent.appendChild(time);
      messageDiv.appendChild(messageContent);
      this.messagesContainer.appendChild(messageDiv);
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

      this.messages.push({ content, sender, timestamp: new Date() });
    }

    showTyping() {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'botrix-message bot';
      typingDiv.innerHTML = `
        <div class="botrix-typing">
          <div class="botrix-typing-dot"></div>
          <div class="botrix-typing-dot"></div>
          <div class="botrix-typing-dot"></div>
        </div>
      `;
      typingDiv.id = 'botrix-typing';
      this.messagesContainer.appendChild(typingDiv);
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    hideTyping() {
      const typing = document.getElementById('botrix-typing');
      if (typing) {
        typing.remove();
      }
    }

    async sendMessage() {
      const message = this.input.value.trim();
      if (!message) return;

      this.addMessage(message, 'user');
      this.input.value = '';
      this.input.disabled = true;
      this.sendButton.disabled = true;
      this.sendButton.textContent = 'Sending...';

      this.showTyping();

      // Demo mode or fallback responses (only if explicitly set)
      if (this.options.demoMode) {
        this.hideTyping();
        const demoResponses = [
                  "This is a demo response! In a real setup, this would come from your automation.",
        "I'm a demo bot. To get real responses, create a bot in your dashboard and configure your webhook.",
        "Demo mode: Your message was received! Real bots would process this through automation workflows.",
        "This is just a test response. Connect your automation for intelligent replies!",
        ];
        const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];
        this.addMessage(randomResponse, 'bot');
        
        this.input.disabled = false;
        this.sendButton.disabled = false;
        this.sendButton.textContent = 'Send';
        this.input.focus();
        return;
      }

      try {
        const response = await this.chatService.sendMessage(message);
        this.hideTyping();
        
        // Handle new response format (array with message objects)
        if (Array.isArray(response) && response.length > 0) {
          const firstMessage = response[0];
          if (firstMessage.content && firstMessage.content.text) {
            this.addMessage(firstMessage.content.text, 'bot');
          } else {
            console.error('Invalid message format:', firstMessage);
            this.addMessage('Sorry, I received an invalid response. Please try again.', 'bot');
          }
        } else if (response.success && response.response) {
          // Fallback for old format
          this.addMessage(response.response, 'bot');
        } else {
          console.error('Invalid response format:', response);
          this.addMessage('Sorry, I received an invalid response. Please try again.', 'bot');
        }
      } catch (error) {
        this.hideTyping();
        console.error('Chat error:', error);
        
        // Fallback to demo response for better UX
        const fallbackResponses = [
          "I'm having trouble connecting to my brain right now. This is a demo response!",
          "Oops! Network issue detected. Here's a sample response to show the UI works.",
          "Connection error - but don't worry, this demonstrates how the chat interface works!",
        ];
        const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        this.addMessage(fallbackResponse, 'bot');
      } finally {
        this.input.disabled = false;
        this.sendButton.disabled = false;
        this.sendButton.textContent = 'Send';
        this.input.focus();
      }
    }

    open() {
      this.widget.style.display = 'flex';
      this.toggleButton.style.display = 'none';
      this.isOpen = true;
      this.input.focus();
    }

    close() {
      this.widget.style.display = 'none';
      this.toggleButton.style.display = 'block';
      this.isOpen = false;
    }

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }
  }

  // Global API
  window.BotrixChat = {
    createWidget: function(botId, options = {}) {
      return new ChatWidget(botId, options);
    }
  };

  // Auto-initialize if data attributes are found
  document.addEventListener('DOMContentLoaded', function() {
    const scripts = document.querySelectorAll('script[data-botrix-bot-id]');
    scripts.forEach(script => {
      const botId = script.getAttribute('data-botrix-bot-id');
      const primaryColor = script.getAttribute('data-botrix-primary-color');
      const position = script.getAttribute('data-botrix-position');
      const welcomeMessage = script.getAttribute('data-botrix-welcome-message');
      
      if (botId) {
        window.BotrixChat.createWidget(botId, {
          primaryColor,
          position,
          welcomeMessage,
        });
      }
    });
  });

})(); 