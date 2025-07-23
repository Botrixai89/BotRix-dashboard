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
          this.conversationId = data.conversationId;
        }

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

  // Voice Service Class
  class VoiceService {
    constructor() {
      this.synthesis = window.speechSynthesis;
      this.recognition = null;
      this.isListening = false;
      this.voices = [];
      this.selectedVoice = null;
      this.isEnabled = false;
      
      this.initSpeechRecognition();
      this.initVoices();
    }

    initSpeechRecognition() {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
      }
    }

    initVoices() {
      const loadVoices = () => {
        this.voices = this.synthesis.getVoices();
        this.selectedVoice = this.voices.find(voice => voice.name.includes('Google')) || this.voices[0];
      };
      
      loadVoices();
      this.synthesis.onvoiceschanged = loadVoices;
    }

    speak(text) {
      if (!this.isEnabled || !text) return;
      
      this.synthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = this.selectedVoice;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      this.synthesis.speak(utterance);
    }

    startListening() {
      if (!this.recognition) return Promise.reject('Speech recognition not supported');
      
      return new Promise((resolve, reject) => {
        this.recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          resolve(transcript);
        };
        
        this.recognition.onerror = (event) => {
          reject(event.error);
        };
        
        this.recognition.onend = () => {
          this.isListening = false;
        };
        
        this.isListening = true;
        this.recognition.start();
      });
    }

    stopListening() {
      if (this.recognition && this.isListening) {
        this.recognition.stop();
        this.isListening = false;
      }
    }

    toggleVoice() {
      this.isEnabled = !this.isEnabled;
      return this.isEnabled;
    }
  }

  // Enhanced Chat Widget Class
  class ChatWidget {
    constructor(botId, options = {}) {
      this.botId = botId;
      this.options = {
        primaryColor: '#667eea',
        secondaryColor: '#764ba2',
        position: 'bottom-right',
        welcomeMessage: '👋 Hello! How can I help you today?',
        baseUrl: '',
        demoMode: false,
        showAvatar: true,
        showTimestamp: true,
        enableVoice: true,
        enableFileUpload: true,
        theme: 'modern', // modern, minimal, gradient
        ...options
      };
      
      this.chatService = new ChatService(botId, this.options.baseUrl);
      this.voiceService = new VoiceService();
      this.isOpen = false;
      this.messages = [];
      this.isTyping = false;
      this.quickReplies = [
        '👋 Hello',
        '❓ Help',
        '📞 Contact',
        '💰 Pricing'
      ];
      
      this.init();
    }

    init() {
      this.createStyles();
      this.createWidget();
      this.createToggleButton();
      this.setupEventListeners();
    }

    createStyles() {
      const styles = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        .botrix-widget {
          position: fixed;
          ${this.options.position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
          bottom: 20px;
          width: 380px;
          height: 600px;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 25px 50px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.05);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          z-index: 10000;
          display: none;
          flex-direction: column;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          overflow: hidden;
          transform: translateY(20px) scale(0.95);
          opacity: 0;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .botrix-widget.open {
          transform: translateY(0) scale(1);
          opacity: 1;
        }

        .botrix-widget-header {
          background: linear-gradient(135deg, ${this.options.primaryColor} 0%, ${this.options.secondaryColor} 100%);
          color: white;
          padding: 20px;
          border-radius: 20px 20px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        .botrix-widget-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="40" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="80" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>');
          pointer-events: none;
        }

        .botrix-widget-header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .botrix-widget-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          border: 2px solid rgba(255,255,255,0.3);
        }

        .botrix-widget-title {
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 2px;
        }

        .botrix-widget-status {
          font-size: 12px;
          opacity: 0.9;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .botrix-status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4ade80;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .botrix-widget-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .botrix-control-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          backdrop-filter: blur(10px);
        }

        .botrix-control-btn:hover {
          background: rgba(255,255,255,0.3);
          transform: scale(1.1);
        }

        .botrix-control-btn.active {
          background: rgba(255,255,255,0.4);
        }

        .botrix-widget-messages {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          scroll-behavior: smooth;
          background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
        }

        .botrix-widget-messages::-webkit-scrollbar {
          width: 4px;
        }

        .botrix-widget-messages::-webkit-scrollbar-track {
          background: transparent;
        }

        .botrix-widget-messages::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 2px;
        }

        .botrix-message {
          margin-bottom: 16px;
          display: flex;
          align-items: flex-end;
          gap: 8px;
          animation: messageSlide 0.3s ease-out;
        }

        @keyframes messageSlide {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .botrix-message.user {
          justify-content: flex-end;
        }

        .botrix-message.bot {
          justify-content: flex-start;
        }

        .botrix-message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${this.options.primaryColor}, ${this.options.secondaryColor});
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .botrix-message-content {
          max-width: 75%;
          display: flex;
          flex-direction: column;
        }

        .botrix-message-bubble {
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.5;
          word-wrap: break-word;
          position: relative;
        }

        .botrix-message.user .botrix-message-bubble {
          background: linear-gradient(135deg, ${this.options.primaryColor}, ${this.options.secondaryColor});
          color: white;
          border-bottom-right-radius: 4px;
        }

        .botrix-message.bot .botrix-message-bubble {
          background: #ffffff;
          color: #374151;
          border: 1px solid #e5e7eb;
          border-bottom-left-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .botrix-message-time {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 4px;
          text-align: right;
        }

        .botrix-message.bot .botrix-message-time {
          text-align: left;
        }

        .botrix-typing {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          border-bottom-left-radius: 4px;
          max-width: 80px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .botrix-typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #9ca3af;
          animation: typingDot 1.4s infinite ease-in-out;
        }

        .botrix-typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .botrix-typing-dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes typingDot {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .botrix-quick-replies {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          flex-wrap: wrap;
        }

        .botrix-quick-reply {
          background: linear-gradient(135deg, ${this.options.primaryColor}15, ${this.options.secondaryColor}15);
          border: 1px solid ${this.options.primaryColor}30;
          color: ${this.options.primaryColor};
          padding: 8px 12px;
          border-radius: 16px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }

        .botrix-quick-reply:hover {
          background: linear-gradient(135deg, ${this.options.primaryColor}25, ${this.options.secondaryColor}25);
          transform: translateY(-1px);
        }

        .botrix-widget-input-container {
          padding: 20px;
          background: #ffffff;
          border-top: 1px solid #e5e7eb;
          border-radius: 0 0 20px 20px;
        }

        .botrix-widget-input-row {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 2px solid #e5e7eb;
          border-radius: 25px;
          padding: 4px;
          transition: all 0.2s;
          position: relative;
        }

        .botrix-widget-input-row.focused {
          border-color: ${this.options.primaryColor};
          box-shadow: 0 0 0 3px ${this.options.primaryColor}20;
        }

        .botrix-widget-input-row.listening {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px #ef444420;
          animation: listening 1s infinite;
        }

        @keyframes listening {
          0%, 100% { box-shadow: 0 0 0 3px #ef444420; }
          50% { box-shadow: 0 0 0 6px #ef444430; }
        }

        .botrix-widget-input {
          flex: 1;
          padding: 12px 16px;
          border: none;
          border-radius: 20px;
          outline: none;
          font-size: 14px;
          background: transparent;
          font-family: inherit;
        }

        .botrix-widget-input::placeholder {
          color: #9ca3af;
        }

        .botrix-input-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-right: 4px;
        }

        .botrix-action-btn {
          background: transparent;
          border: none;
          color: #6b7280;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .botrix-action-btn:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .botrix-action-btn.active {
          background: ${this.options.primaryColor};
          color: white;
        }

        .botrix-widget-send {
          background: linear-gradient(135deg, ${this.options.primaryColor}, ${this.options.secondaryColor});
          color: white;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          box-shadow: 0 4px 12px ${this.options.primaryColor}30;
        }

        .botrix-widget-send:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px ${this.options.primaryColor}40;
        }

        .botrix-widget-send:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .botrix-toggle-button {
          position: fixed;
          ${this.options.position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
          bottom: 20px;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, ${this.options.primaryColor}, ${this.options.secondaryColor});
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 24px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
          z-index: 10001;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .botrix-toggle-button:hover {
          transform: scale(1.1);
          box-shadow: 0 12px 30px rgba(0,0,0,0.2);
        }

        .botrix-toggle-button.pulse {
          animation: buttonPulse 2s infinite;
        }

        @keyframes buttonPulse {
          0%, 100% { box-shadow: 0 8px 25px rgba(0,0,0,0.15), 0 0 0 0 ${this.options.primaryColor}40; }
          50% { box-shadow: 0 8px 25px rgba(0,0,0,0.15), 0 0 0 10px ${this.options.primaryColor}00; }
        }

        .botrix-widget-footer {
          text-align: center;
          font-size: 11px;
          color: #9ca3af;
          padding: 12px 20px;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .botrix-powered-logo {
          width: 16px;
          height: 16px;
          opacity: 0.6;
        }

        .botrix-file-upload {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .botrix-notification {
          position: absolute;
          top: -40px;
          right: 0;
          background: #ef4444;
          color: white;
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          transform: translateY(-10px);
          opacity: 0;
          transition: all 0.3s;
        }

        .botrix-notification.show {
          transform: translateY(0);
          opacity: 1;
        }

        @media (max-width: 480px) {
          .botrix-widget {
            width: calc(100vw - 20px);
            height: calc(100vh - 20px);
            bottom: 10px;
            left: 10px !important;
            right: 10px !important;
            border-radius: 12px;
          }
          
          .botrix-widget-header {
            border-radius: 12px 12px 0 0;
          }
          
          .botrix-widget-input-container {
            border-radius: 0 0 12px 12px;
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
        <div class="botrix-widget-header-info">
          <div class="botrix-widget-avatar">🤖</div>
          <div>
            <div class="botrix-widget-title">AI Assistant</div>
            <div class="botrix-widget-status">
              <div class="botrix-status-indicator"></div>
              Online
            </div>
          </div>
        </div>
        <div class="botrix-widget-controls">
          <button class="botrix-control-btn botrix-voice-toggle" title="Toggle Voice">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>
          <button class="botrix-control-btn botrix-widget-close" title="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
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

      // Action buttons
      const inputActions = document.createElement('div');
      inputActions.className = 'botrix-input-actions';
      
      // Voice button
      const voiceBtn = document.createElement('button');
      voiceBtn.className = 'botrix-action-btn botrix-voice-btn';
      voiceBtn.title = 'Voice message';
      voiceBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
      `;

      // File upload button
      const fileBtn = document.createElement('button');
      fileBtn.className = 'botrix-action-btn botrix-file-btn';
      fileBtn.title = 'Upload file';
      fileBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49"></path>
        </svg>
      `;

      // Send button
      this.sendButton = document.createElement('button');
      this.sendButton.className = 'botrix-widget-send';
      this.sendButton.title = 'Send';
      this.sendButton.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
        </svg>
      `;

      // Input row wrapper
      const inputRow = document.createElement('div');
      inputRow.className = 'botrix-widget-input-row';
      inputActions.appendChild(voiceBtn);
      inputActions.appendChild(fileBtn);
      inputRow.appendChild(this.input);
      inputRow.appendChild(inputActions);
      inputRow.appendChild(this.sendButton);

      inputContainer.appendChild(inputRow);

      this.widget.appendChild(header);
      this.widget.appendChild(this.messagesContainer);
      this.widget.appendChild(inputContainer);

      // Powered by footer
      const footer = document.createElement('div');
      footer.className = 'botrix-widget-footer';
      footer.innerHTML = `
        Powered by 
        <img src="/botrix-logo01.png" alt="Botrix" class="botrix-powered-logo"/>
      `;
      this.widget.appendChild(footer);

      document.body.appendChild(this.widget);

      // Store references
      this.inputRow = inputRow;
      this.voiceBtn = voiceBtn;
      this.fileBtn = fileBtn;
      this.voiceToggle = header.querySelector('.botrix-voice-toggle');

      if (this.options.welcomeMessage) {
        this.addMessage(this.options.welcomeMessage, 'bot');
        this.showQuickReplies();
      }
    }

    createToggleButton() {
      this.toggleButton = document.createElement('button');
      this.toggleButton.className = 'botrix-toggle-button pulse';
      this.toggleButton.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      `;

      document.body.appendChild(this.toggleButton);
    }

    setupEventListeners() {
      // Close button
      this.widget.querySelector('.botrix-widget-close').addEventListener('click', () => this.toggle());
      
      // Send button
      this.sendButton.addEventListener('click', () => this.sendMessage());
      
      // Input events
      this.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.sendMessage();
        }
      });

      this.input.addEventListener('focus', () => {
        this.inputRow.classList.add('focused');
      });

      this.input.addEventListener('blur', () => {
        this.inputRow.classList.remove('focused');
      });

      // Voice button
      this.voiceBtn.addEventListener('click', () => this.handleVoiceInput());
      
      // Voice toggle
      this.voiceToggle.addEventListener('click', () => {
        const enabled = this.voiceService.toggleVoice();
        this.voiceToggle.classList.toggle('active', enabled);
        this.showNotification(enabled ? 'Voice enabled' : 'Voice disabled');
      });

      // File upload
      this.fileBtn.addEventListener('click', () => this.handleFileUpload());

      // Toggle button
      this.toggleButton.addEventListener('click', () => this.toggle());
    }

    addMessage(content, sender, options = {}) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `botrix-message ${sender}`;

      const messageContent = document.createElement('div');
      messageContent.className = 'botrix-message-content';

      // Add avatar for bot messages
      if (sender === 'bot' && this.options.showAvatar) {
        const avatar = document.createElement('div');
        avatar.className = 'botrix-message-avatar';
        avatar.textContent = '🤖';
        messageDiv.appendChild(avatar);
      }

      const bubble = document.createElement('div');
      bubble.className = 'botrix-message-bubble';
      bubble.textContent = content;

      // Add timestamp if enabled
      if (this.options.showTimestamp) {
        const time = document.createElement('div');
        time.className = 'botrix-message-time';
        time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageContent.appendChild(time);
      }

      messageContent.appendChild(bubble);
      messageDiv.appendChild(messageContent);
      this.messagesContainer.appendChild(messageDiv);
      this.scrollToBottom();

      // Speak bot messages if voice is enabled
      if (sender === 'bot' && this.voiceService.isEnabled) {
        this.voiceService.speak(content);
      }

      this.messages.push({ content, sender, timestamp: new Date() });
    }

    showQuickReplies() {
      const quickRepliesDiv = document.createElement('div');
      quickRepliesDiv.className = 'botrix-quick-replies';
      
      this.quickReplies.forEach(reply => {
        const button = document.createElement('button');
        button.className = 'botrix-quick-reply';
        button.textContent = reply;
        button.addEventListener('click', () => {
          this.input.value = reply;
          this.sendMessage();
          quickRepliesDiv.remove();
        });
        quickRepliesDiv.appendChild(button);
      });

      this.messagesContainer.appendChild(quickRepliesDiv);
      this.scrollToBottom();
    }

    showTyping() {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'botrix-message bot';
      typingDiv.innerHTML = `
        <div class="botrix-message-avatar">🤖</div>
        <div class="botrix-typing">
          <div class="botrix-typing-dot"></div>
          <div class="botrix-typing-dot"></div>
          <div class="botrix-typing-dot"></div>
        </div>
      `;
      typingDiv.id = 'botrix-typing';
      this.messagesContainer.appendChild(typingDiv);
      this.scrollToBottom();
    }

    hideTyping() {
      const typing = document.getElementById('botrix-typing');
      if (typing) {
        typing.remove();
      }
    }

    async handleVoiceInput() {
      if (this.voiceService.isListening) {
        this.voiceService.stopListening();
        this.voiceBtn.classList.remove('active');
        this.inputRow.classList.remove('listening');
        return;
      }

      try {
        this.voiceBtn.classList.add('active');
        this.inputRow.classList.add('listening');
        this.input.placeholder = 'Listening...';
        
        const transcript = await this.voiceService.startListening();
        this.input.value = transcript;
        this.input.focus();
        
        // Auto-send if transcript is complete
        if (transcript.trim()) {
          setTimeout(() => this.sendMessage(), 500);
        }
      } catch (error) {
        console.error('Voice input error:', error);
        this.showNotification('Voice input failed');
      } finally {
        this.voiceBtn.classList.remove('active');
        this.inputRow.classList.remove('listening');
        this.input.placeholder = 'Type your message...';
      }
    }

    handleFileUpload() {
      // Create file input
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*,.pdf,.doc,.docx,.txt';
      fileInput.style.display = 'none';
      
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          // For demo purposes, just show file name
          this.addMessage(`📎 ${file.name} (${this.formatFileSize(file.size)})`, 'user');
          this.addMessage('File received! I can help you with document analysis once this feature is fully implemented.', 'bot');
        }
      });
      
      document.body.appendChild(fileInput);
      fileInput.click();
      document.body.removeChild(fileInput);
    }

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showNotification(message) {
      const notification = document.createElement('div');
      notification.className = 'botrix-notification';
      notification.textContent = message;
      this.widget.appendChild(notification);
      
      setTimeout(() => notification.classList.add('show'), 100);
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }, 2000);
    }

    async sendMessage() {
      const message = this.input.value.trim();
      if (!message) return;

      this.addMessage(message, 'user');
      this.input.value = '';
      this.input.disabled = true;
      this.sendButton.disabled = true;

      this.showTyping();

      // Demo mode responses
      if (this.options.demoMode) {
        this.hideTyping();
        const demoResponses = [
          "Thanks for your message! This is a demo response. In production, this would connect to your AI assistant.",
          "I understand you're interested in our services. How can I help you today?",
          "Great question! I'm here to assist you with any information you need.",
          "I'd be happy to help you with that. Let me connect you with the right information.",
        ];
        const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];
        
        setTimeout(() => {
          this.addMessage(randomResponse, 'bot');
          this.input.disabled = false;
          this.sendButton.disabled = false;
          this.input.focus();
        }, 1000 + Math.random() * 1000);
        return;
      }

      try {
        const response = await this.chatService.sendMessage(message);
        this.hideTyping();
        
        if (Array.isArray(response) && response.length > 0) {
          const firstMessage = response[0];
          if (firstMessage.content && firstMessage.content.text) {
            this.addMessage(firstMessage.content.text, 'bot');
          } else {
            this.addMessage('I received your message but had trouble processing it. Please try again.', 'bot');
          }
        } else if (response.success && response.response) {
          this.addMessage(response.response, 'bot');
        } else {
          this.addMessage('Sorry, I\'m having technical difficulties. Please try again later.', 'bot');
        }
      } catch (error) {
        this.hideTyping();
        console.error('Chat error:', error);
        
        const fallbackResponses = [
          "I'm having trouble connecting right now, but I'm here to help! Try asking me something else.",
          "There seems to be a connection issue. Don't worry, I'll be back online shortly!",
          "I'm experiencing some technical difficulties. Please try again in a moment.",
        ];
        const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        this.addMessage(fallbackResponse, 'bot');
      } finally {
        this.input.disabled = false;
        this.sendButton.disabled = false;
        this.input.focus();
      }
    }

    scrollToBottom() {
      setTimeout(() => {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
      }, 100);
    }

    open() {
      this.widget.style.display = 'flex';
      this.toggleButton.style.display = 'none';
      this.toggleButton.classList.remove('pulse');
      
      setTimeout(() => {
        this.widget.classList.add('open');
        this.isOpen = true;
        this.input.focus();
      }, 50);
    }

    close() {
      this.widget.classList.remove('open');
      
      setTimeout(() => {
        this.widget.style.display = 'none';
        this.toggleButton.style.display = 'flex';
        this.isOpen = false;
      }, 300);
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
      const primaryColor = script.getAttribute('data-botrix-primary-color') || '#667eea';
      const secondaryColor = script.getAttribute('data-botrix-secondary-color') || '#764ba2';
      const position = script.getAttribute('data-botrix-position') || 'bottom-right';
      const welcomeMessage = script.getAttribute('data-botrix-welcome-message');
      const enableVoice = script.getAttribute('data-botrix-enable-voice') !== 'false';
      const theme = script.getAttribute('data-botrix-theme') || 'modern';
      
      if (botId) {
        window.BotrixChat.createWidget(botId, {
          primaryColor,
          secondaryColor,
          position,
          welcomeMessage,
          enableVoice,
          theme,
          demoMode: true // Enable demo mode for testing
        });
      }
    });
  });

})(); 