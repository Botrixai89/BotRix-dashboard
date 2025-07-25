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

  // Enhanced Voice Service Class with Google Cloud Integration
  class VoiceService {
    constructor() {
      this.synthesis = window.speechSynthesis;
      this.recognition = null;
      this.isListening = false;
      this.voices = [];
      this.selectedVoice = null;
      this.isEnabled = false;
      this.useGoogleCloud = false; // Toggle between browser and Google Cloud
      this.googleApiKey = null;
      this.mediaStream = null;
      this.mediaRecorder = null;
      
      this.initSpeechRecognition();
      this.initVoices();
      this.checkGoogleCloudSupport();
    }

    async checkGoogleCloudSupport() {
      // Check if Google Cloud API key is available
      try {
        const response = await fetch('/api/voice/check-support');
        const data = await response.json();
        this.useGoogleCloud = data.supported;
        this.googleApiKey = data.apiKey;
        console.log('Google Cloud Voice support:', this.useGoogleCloud);
      } catch (error) {
        console.log('Using browser voice services (fallback)');
        this.useGoogleCloud = false;
      }
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

    async speak(text) {
      if (!this.isEnabled || !text) return;
      
      if (this.useGoogleCloud && this.googleApiKey) {
        await this.speakWithGoogleCloud(text);
      } else {
        this.speakWithBrowser(text);
      }
    }

    speakWithBrowser(text) {
      this.synthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = this.selectedVoice;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      this.synthesis.speak(utterance);
    }

    async speakWithGoogleCloud(text) {
      try {
        const response = await fetch('/api/voice/text-to-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            settings: {
              voice: 'alloy',
              speed: 1.0,
              pitch: 0,
              language: 'en-US'
            },
            apiKey: this.googleApiKey,
          }),
        });

        if (!response.ok) {
          throw new Error(`Google Cloud TTS failed: ${response.statusText}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
        
      } catch (error) {
        console.error('Google Cloud TTS error:', error);
        // Fallback to browser TTS
        this.speakWithBrowser(text);
      }
    }

    async startListening() {
      if (this.useGoogleCloud && this.googleApiKey) {
        return this.startListeningWithGoogleCloud();
      } else {
        return this.startListeningWithBrowser();
      }
    }

    startListeningWithBrowser() {
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

    async startListeningWithGoogleCloud() {
      try {
        // Request microphone access
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Create MediaRecorder to capture audio
        this.mediaRecorder = new MediaRecorder(this.mediaStream);
        const audioChunks = [];
        
        return new Promise((resolve, reject) => {
          this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunks.push(event.data);
            }
          };

          this.mediaRecorder.onstop = async () => {
            try {
              const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
              const transcript = await this.speechToTextWithGoogleCloud(audioBlob);
              resolve(transcript);
            } catch (error) {
              reject(error);
            } finally {
              this.isListening = false;
            }
          };

          this.mediaRecorder.onerror = (error) => {
            reject(error);
            this.isListening = false;
          };

          // Start recording
          this.mediaRecorder.start();
          this.isListening = true;
          
          // Stop recording after 10 seconds
          setTimeout(() => {
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
              this.mediaRecorder.stop();
            }
          }, 10000);
        });

      } catch (error) {
        console.error('Google Cloud STT error:', error);
        throw error;
      }
    }

    async speechToTextWithGoogleCloud(audioBlob) {
      try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');
        formData.append('apiKey', this.googleApiKey);

        const response = await fetch('/api/voice/speech-to-text', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Google Cloud STT failed: ${response.statusText}`);
        }

        const result = await response.json();
        return result.transcript || '';

      } catch (error) {
        console.error('Speech-to-Text error:', error);
        throw error;
      }
    }

    stopListening() {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }
      
      if (this.recognition && this.isListening) {
        this.recognition.stop();
      }
      
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }
      
      this.isListening = false;
    }

    toggleVoice() {
      this.isEnabled = !this.isEnabled;
      return this.isEnabled;
    }

    toggleGoogleCloud() {
      this.useGoogleCloud = !this.useGoogleCloud;
      return this.useGoogleCloud;
    }
  }

  // Enhanced Chat Widget Class
  class ChatWidget {
    constructor(botId, options = {}) {
      this.botId = botId;
      this.options = {
        primaryColor: '#8b5cf6',
        secondaryColor: '#ec4899',
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
        '💎 Pricing'
      ];
      this.userName = null; // Store the user's name
      this.botLogo = null; // Store the bot's company logo
      this.botData = null; // Store the complete bot data
      this.welcomeMessageAdded = false; // Track if welcome message has been added
      this.popupDismissed = false; // Track if popup is dismissed
      this.headerColor = null; // Dynamic header color
      this.footerColor = null; // Dynamic footer color
      this.bodyColor = null; // Dynamic body color
      this.widgetImages = null; // Dynamic widget images
      
      // Try to load user name from localStorage
      this.loadUserName();
      
      this.init();
    }

    loadUserName() {
      try {
        const storedName = localStorage.getItem(`botrix_user_name_${this.botId}`);
        if (storedName) {
          this.userName = storedName;
          console.log('Loaded user name from localStorage:', this.userName);
        }
      } catch (error) {
        console.error('Error loading user name from localStorage:', error);
      }
    }

    saveUserName(name) {
      try {
        localStorage.setItem(`botrix_user_name_${this.botId}`, name);
        console.log('Saved user name to localStorage:', name);
      } catch (error) {
        console.error('Error saving user name to localStorage:', error);
      }
    }

    init() {
      this.createStyles();
      this.createWidget();
      this.createToggleButton();
      this.createMinimizedPopup(); // Add popup
      this.setupEventListeners();
      this.fetchBotDetails();
    }

    async fetchBotDetails() {
      try {
        const response = await fetch(`${this.options.baseUrl}/api/bots/${this.botId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.bot) {
            // Update bot logo if available (prefer settings.logo)
            if (data.bot.settings && data.bot.settings.logo) {
              this.botLogo = data.bot.settings.logo;
              console.log('Using custom widget logo:', this.botLogo);
            } else if (data.bot.companyLogo) {
              this.botLogo = data.bot.companyLogo;
              console.log('Using company logo:', this.botLogo);
            } else if (data.bot.avatar) {
              this.botLogo = data.bot.avatar;
              console.log('Using bot avatar as logo:', this.botLogo);
            } else {
              console.log('No logo available, using fallback icon');
            }
            // Store color and image settings
            this.headerColor = data.bot.settings?.headerColor || '#8b5cf6';
            this.footerColor = data.bot.settings?.footerColor || '#f8fafc';
            this.bodyColor = data.bot.settings?.bodyColor || '#ffffff';
            this.widgetImages = data.bot.settings?.widgetImages || [];
            // Always update header logo (with fallback if no logo)
            this.updateHeaderLogo();
            this.updateExistingBotMessageAvatars();
            // Update bot name
            if (data.bot.name) {
              this.updateHeaderTitle(data.bot.name);
            }
            // Store bot data for later use
            this.botData = data.bot;
            // Update toggle button icon with bot settings
            this.updateToggleButtonIcon();
            // Add welcome message after bot details are fully loaded
            if (this.options.welcomeMessage && !this.welcomeMessageAdded) {
              this.addMessage(this.options.welcomeMessage, 'bot');
              this.showQuickReplies();
              this.welcomeMessageAdded = true;
            }
            // Re-create styles with new colors
            this.createStyles(true);
          }
        }
      } catch (error) {
        console.error('Error fetching bot details:', error);
        // Set default title if fetch fails
        this.updateHeaderTitle('AI Assistant');
        // Update header logo with fallback icon
        this.updateHeaderLogo();
        
        // Add welcome message even if fetch fails
        if (this.options.welcomeMessage && !this.welcomeMessageAdded) {
          console.log('Adding welcome message with fallback (fetch failed)');
          this.addMessage(this.options.welcomeMessage, 'bot');
          this.showQuickReplies();
          this.welcomeMessageAdded = true;
        }
      }
    }

    updateHeaderLogo() {
      const avatarElement = this.widget.querySelector('.botrix-widget-avatar');
      if (avatarElement) {
        if (this.botLogo) {
          avatarElement.innerHTML = `<img src="${this.botLogo}" alt="Company Logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`;
        } else {
          // Fallback to default icon
          avatarElement.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          `;
        }
      }
    }

    updateExistingBotMessageAvatars() {
      // Update all existing bot message avatars with the bot logo
      const botMessageAvatars = this.messagesContainer.querySelectorAll('.botrix-message.bot .botrix-message-avatar');
      console.log('Updating', botMessageAvatars.length, 'existing bot message avatars');
      botMessageAvatars.forEach((avatar, index) => {
        if (this.botLogo) {
          console.log(`Updating avatar ${index + 1} with logo:`, this.botLogo);
          avatar.innerHTML = `<img src="${this.botLogo}" alt="Bot Logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`;
        } else {
          console.log(`Updating avatar ${index + 1} with fallback icon`);
          avatar.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          `;
        }
      });
    }

    updateHeaderTitle(botName) {
      const titleElement = this.widget.querySelector('.botrix-widget-title');
      if (titleElement) {
        titleElement.textContent = botName;
      }
    }

    createStyles(forceUpdate = false) {
      // Use dynamic colors if available
      const headerColor = this.headerColor || this.options.primaryColor || '#8b5cf6';
      const footerColor = this.footerColor || '#f8fafc';
      const bodyColor = this.bodyColor || '#ffffff';
      const styleId = 'botrix-widget-styles';
      let styleElement = document.getElementById(styleId);
      if (styleElement && !forceUpdate) return;
      if (styleElement && forceUpdate) styleElement.remove();
      const styles = `
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        
        .botrix-widget {
          position: fixed;
          ${this.options.position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
          bottom: 20px;
          width: 320px;
          height: 480px;
          background: ${bodyColor};
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.05);
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
          background: ${headerColor};
          color: white;
          padding: 16px;
          border-radius: 16px 16px 0 0;
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
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          border: 2px solid rgba(255,255,255,0.3);
        }

        .botrix-widget-title {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .botrix-widget-status {
          font-size: 11px;
          opacity: 0.9;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .botrix-status-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
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
          width: 28px;
          height: 28px;
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
          padding: 16px;
          overflow-y: auto;
          scroll-behavior: smooth;
          background: #ffffff;
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
          margin-bottom: 12px;
          display: flex;
          align-items: flex-end;
          gap: 6px;
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
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .botrix-message-content {
          max-width: 75%;
          display: flex;
          flex-direction: column;
        }

        .botrix-message-bubble {
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 13px;
          line-height: 1.4;
          word-wrap: break-word;
          position: relative;
        }

        .botrix-message.user .botrix-message-bubble {
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
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
          font-size: 10px;
          color: #9ca3af;
          margin-top: 3px;
          text-align: right;
        }

        .botrix-message.bot .botrix-message-time {
          text-align: left;
        }

        .botrix-typing {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          border-bottom-left-radius: 4px;
          max-width: 70px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .botrix-typing-dot {
          width: 5px;
          height: 5px;
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
          gap: 6px;
          margin-top: 10px;
          flex-wrap: wrap;
        }

        .botrix-quick-reply {
          background: linear-gradient(135deg, #fce7f3, #fdf2f8);
          border: 1px solid #fbcfe8;
          color: #be185d;
          padding: 6px 10px;
          border-radius: 14px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }

        .botrix-quick-reply:hover {
          background: linear-gradient(135deg, #f9a8d4, #fbcfe8);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(236, 72, 153, 0.2);
        }

        .botrix-widget-input-container {
          padding: 16px;
          background: #ffffff;
          border-top: 1px solid #e5e7eb;
          border-radius: 0 0 16px 16px;
        }

        .botrix-widget-input-row {
          display: flex;
          align-items: center;
          background: #ffffff;
          border: 2px solid #fce7f3;
          border-radius: 20px;
          padding: 3px;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }

        .botrix-widget-input-row.focused {
          border-color: #ec4899;
          box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
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
          padding: 10px 14px;
          border: none;
          outline: none;
          font-size: 13px;
          background: transparent;
          font-family: inherit;
          min-width: 0;
        }

        .botrix-widget-input::placeholder {
          color: #9ca3af;
        }

        .botrix-input-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-right: 4px;
          flex-shrink: 0;
        }

        .botrix-action-btn {
          background: transparent;
          border: none;
          color: #6b7280;
          width: 28px;
          height: 28px;
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
          background: #ec4899;
          color: white;
        }

        .botrix-widget-send {
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          color: white;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
          flex-shrink: 0;
        }

        .botrix-widget-send:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
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
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 20px;
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
          0%, 100% { box-shadow: 0 8px 25px rgba(0,0,0,0.15), 0 0 0 0 rgba(139, 92, 246, 0.4); }
          50% { box-shadow: 0 8px 25px rgba(0,0,0,0.15), 0 0 0 10px rgba(139, 92, 246, 0); }
        }

        .botrix-widget-footer {
          text-align: center;
          font-size: 10px;
          color: #9ca3af;
          padding: 10px 16px;
          background: ${footerColor};
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .botrix-powered-logo {
          width: 14px;
          height: 14px;
          opacity: 0.6;
          transition: opacity 0.2s, transform 0.2s;
          cursor: pointer;
        }

        .botrix-powered-logo:hover {
          opacity: 1;
          transform: scale(1.05);
        }

        .botrix-widget-images {
          display: flex;
          gap: 8px;
          margin: 8px 0;
        }

        .botrix-widget-images img {
          width: 40px;
          height: 40px;
          object-fit: contain;
          border-radius: 8px;
        }


        .botrix-notification {
          position: absolute;
          top: -35px;
          right: 0;
          background: #ef4444;
          color: white;
          padding: 6px 10px;
          border-radius: 10px;
          font-size: 11px;
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

        .botrix-widget-messages,
        .botrix-widget-header,
        .botrix-widget-input-container,
        .botrix-widget-title,
        .botrix-widget-status,
        .botrix-message-bubble,
        .botrix-message-time,
        .botrix-quick-reply,
        .botrix-widget-input,
        .botrix-toggle-button,
        .botrix-widget-footer,
        .botrix-minimized-popup {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
      `;

      styleElement = document.createElement('style');
      styleElement.id = styleId;
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
          <div class="botrix-widget-avatar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          </div>
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
        <img src="${this.options.baseUrl}/botrix-logo01.png" alt="Botrix" class="botrix-powered-logo" style="cursor: pointer; width: 54px; height: 19px;"/>
      `;
      // Add widget images if available
      if (this.widgetImages && this.widgetImages.length > 0) {
        const imagesDiv = document.createElement('div');
        imagesDiv.className = 'botrix-widget-images';
        imagesDiv.style.display = 'flex';
        imagesDiv.style.gap = '8px';
        imagesDiv.style.margin = '8px 0';
        this.widgetImages.forEach(url => {
          if (url) {
            const img = document.createElement('img');
            img.src = url;
            img.alt = 'Widget Image';
            img.style.width = '40px';
            img.style.height = '40px';
            img.style.objectFit = 'contain';
            img.style.borderRadius = '8px';
            imagesDiv.appendChild(img);
          }
        });
        this.widget.appendChild(imagesDiv);
      }
      this.widget.appendChild(footer);
      
      // Add click event to logo for dashboard redirect
      const logoElement = footer.querySelector('.botrix-powered-logo');
      if (logoElement) {
        logoElement.addEventListener('click', () => {
          // Always redirect to main dashboard, not bot-specific
          const dashboardUrl = `${this.options.baseUrl}/dashboard`;
          window.open(dashboardUrl, '_blank');
        });
      }

      document.body.appendChild(this.widget);

      // Store references
      this.inputRow = inputRow;
      this.voiceBtn = voiceBtn;
      this.voiceToggle = header.querySelector('.botrix-voice-toggle');

      // Welcome message will be added after bot details are fetched
    }

    createMinimizedPopup() {
      // Check if dismissed in localStorage
      try {
        if (localStorage.getItem('botrix_popup_dismissed')) {
          this.popupDismissed = true;
          return;
        }
      } catch (e) {}
      this.minimizedPopup = document.createElement('div');
      this.minimizedPopup.className = 'botrix-minimized-popup';
      this.minimizedPopup.innerHTML = `
        <span class="botrix-popup-text">💬 Chat with us</span>
        <button class="botrix-popup-close" title="Close">×</button>
      `;
      this.minimizedPopup.style.display = 'none';
      document.body.appendChild(this.minimizedPopup);
      // Show close button only on hover
      const closeBtn = this.minimizedPopup.querySelector('.botrix-popup-close');
      closeBtn.style.display = 'none';
      this.minimizedPopup.addEventListener('mouseenter', () => {
        closeBtn.style.display = 'inline-block';
      });
      this.minimizedPopup.addEventListener('mouseleave', () => {
        closeBtn.style.display = 'none';
      });
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.minimizedPopup.style.display = 'none';
        this.popupDismissed = true;
        try { localStorage.setItem('botrix_popup_dismissed', '1'); } catch (e) {}
        console.log('[Botrix] Minimized popup dismissed');
      });
      // Position popup near toggle button
      this.tryShowMinimizedPopup();
      window.addEventListener('resize', () => this.positionMinimizedPopup());
    }

    tryShowMinimizedPopup(retryCount = 0) {
      // Only show if chat is minimized and not dismissed
      if (this.isOpen || this.popupDismissed) {
        if (this.minimizedPopup) this.minimizedPopup.style.display = 'none';
        return;
      }
      if (!this.toggleButton) {
        // Retry after a short delay if toggleButton not ready
        if (retryCount < 10) {
          setTimeout(() => this.tryShowMinimizedPopup(retryCount + 1), 100);
        }
        return;
      }
      this.positionMinimizedPopup();
      this.minimizedPopup.style.display = 'flex';
      console.log('[Botrix] Minimized popup shown');
    }

    positionMinimizedPopup() {
      if (!this.minimizedPopup || !this.toggleButton) return;
      // Position to the left or right of the toggle button
      const btnRect = this.toggleButton.getBoundingClientRect();
      this.minimizedPopup.style.position = 'fixed';
      this.minimizedPopup.style.zIndex = 10002;
      this.minimizedPopup.style.bottom = (window.innerHeight - btnRect.bottom + 60) + 'px';
      if (this.options.position === 'bottom-left') {
        this.minimizedPopup.style.left = (btnRect.left + btnRect.width + 10) + 'px';
        this.minimizedPopup.style.right = '';
      } else {
        this.minimizedPopup.style.right = (window.innerWidth - btnRect.right + btnRect.width + 10) + 'px';
        this.minimizedPopup.style.left = '';
      }
    }

    createToggleButton() {
      this.toggleButton = document.createElement('button');
      this.toggleButton.className = 'botrix-toggle-button pulse';
      
      // Set custom icon based on bot settings
      this.updateToggleButtonIcon();

      document.body.appendChild(this.toggleButton);
    }

    updateToggleButtonIcon() {
      if (!this.toggleButton) return;
      
      // Get icon settings from bot data
      const iconType = this.botData?.settings?.widgetIconType || 'default';
      const iconEmoji = this.botData?.settings?.widgetIconEmoji || '💬';
      const iconUrl = this.botData?.settings?.widgetIcon || '';
      
      let iconHtml = '';
      
      switch (iconType) {
        case 'emoji':
          iconHtml = `<span style="font-size: 28px; line-height: 1;">${iconEmoji}</span>`;
          break;
        case 'custom':
          if (iconUrl) {
            iconHtml = `<img src="${iconUrl}" alt="Custom Icon" style="width: 28px; height: 28px; object-fit: contain;" />`;
          } else {
            // Fallback to default
            iconHtml = `
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            `;
          }
          break;
        default:
          iconHtml = `
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          `;
          break;
      }
      
      this.toggleButton.innerHTML = iconHtml;
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
        if (this.botLogo) {
          console.log('Adding bot message with logo:', this.botLogo);
          avatar.innerHTML = `<img src="${this.botLogo}" alt="Bot Logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`;
        } else {
          console.log('Adding bot message with fallback icon (no logo available)');
          avatar.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          `;
        }
        messageDiv.appendChild(avatar);
      }
      // Add avatar and name for user messages
      if (sender === 'user') {
        const avatar = document.createElement('div');
        avatar.className = 'botrix-message-avatar';
        avatar.textContent = (this.userName && this.userName.length > 0) ? this.userName[0].toUpperCase() : 'U';
        messageDiv.appendChild(avatar);
      }

      const bubble = document.createElement('div');
      bubble.className = 'botrix-message-bubble';
      bubble.textContent = content;

      // Add user name above user message
      if (sender === 'user') {
        const nameDiv = document.createElement('div');
        nameDiv.className = 'botrix-message-username';
        nameDiv.style.fontSize = '12px';
        nameDiv.style.color = '#6b7280';
        nameDiv.style.marginBottom = '2px';
        nameDiv.textContent = this.userName || 'You';
        messageContent.appendChild(nameDiv);
      }

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
        this.voiceService.speak(content).catch(error => {
          console.error('Voice synthesis error:', error);
        });
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
      
      let avatarHtml = '';
      if (this.botLogo) {
        avatarHtml = `<div class="botrix-message-avatar"><img src="${this.botLogo}" alt="Bot Logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" /></div>`;
      } else {
        avatarHtml = `
          <div class="botrix-message-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          </div>
        `;
      }
      
      typingDiv.innerHTML = `
        ${avatarHtml}
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
        
        // Process the response and extract user name if available
        if (Array.isArray(response) && response.length > 0) {
          response.forEach(msg => {
            // Extract user name from response if available
            if (msg.userInfo && msg.userInfo.name && !this.userName) {
              this.userName = msg.userInfo.name;
              this.saveUserName(this.userName);
              console.log('Extracted user name from response:', this.userName);
            }
            
            if (msg.content && msg.content.text) {
              this.addMessage(msg.content.text, 'bot');
            } else {
              this.addMessage('I received your message but had trouble processing it. Please try again.', 'bot');
            }
          });
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
      if (this.minimizedPopup) this.minimizedPopup.style.display = 'none';
      setTimeout(() => {
        this.widget.classList.add('open');
        this.isOpen = true;
        this.input.focus();
      }, 50);
      console.log('[Botrix] Chat opened, minimized popup hidden');
    }

    close() {
      this.widget.classList.remove('open');
      setTimeout(() => {
        this.widget.style.display = 'none';
        this.toggleButton.style.display = 'flex';
        this.isOpen = false;
        // Show popup if not dismissed
        this.tryShowMinimizedPopup();
      }, 300);
      console.log('[Botrix] Chat closed, minimized popup may show');
    }

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }
  }

  // Add popup styles
  const popupStyles = `
    .botrix-minimized-popup {
      position: fixed;
      background: linear-gradient(135deg, #8b5cf6, #ec4899);
      color: white;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(139, 92, 246, 0.15);
      padding: 10px 18px;
      font-size: 15px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      z-index: 10002;
      transition: opacity 0.2s, transform 0.2s;
      opacity: 0.95;
      min-width: 120px;
      max-width: 220px;
      user-select: none;
    }
    .botrix-minimized-popup .botrix-popup-close {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      font-size: 18px;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      cursor: pointer;
      display: none;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    .botrix-minimized-popup .botrix-popup-close:hover {
      background: rgba(255,255,255,0.4);
    }
  `;
  const popupStyleElement = document.createElement('style');
  popupStyleElement.textContent = popupStyles;
  document.head.appendChild(popupStyleElement);

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
      const primaryColor = script.getAttribute('data-botrix-primary-color') || '#8b5cf6';
      const secondaryColor = script.getAttribute('data-botrix-secondary-color') || '#ec4899';
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