(function() {
  'use strict';
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
        welcomeMessage: 'Hello! How can I help you today?',
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
        '👋 Say Hello',
        '❓ Get Help',
        '📞 Contact Us',
        '💎 View Pricing'
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

    adjustColor(color, amount) {
      const hex = color.replace('#', '');
      const num = parseInt(hex, 16);
      const r = Math.max(0, Math.min(255, (num >> 16) + amount));
      const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
      const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
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
            let botHeaderColor = data.bot.settings?.headerColor || '#8b5cf6';
            // Force darker colors for better visibility
            if (botHeaderColor) {
              // If it's a light green color, make it darker
              if (botHeaderColor.toLowerCase() === '#10b981' || botHeaderColor.toLowerCase() === '#059669' || 
                  botHeaderColor.toLowerCase() === '#34d399' || botHeaderColor.toLowerCase() === '#6ee7b7') {
                this.headerColor = '#059669'; // Use darker green
              } else {
                // For other colors, make them slightly darker
                this.headerColor = this.adjustColor(botHeaderColor, -20);
              }
            } else {
              this.headerColor = '#8b5cf6';
            }
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
      let headerColor = this.headerColor || this.options.primaryColor || '#8b5cf6';
      // Ensure the color is dark enough for good visibility
      if (headerColor) {
        // If it's a light green color, make it darker
        if (headerColor.toLowerCase() === '#10b981' || headerColor.toLowerCase() === '#34d399' || 
            headerColor.toLowerCase() === '#6ee7b7') {
          headerColor = '#059669'; // Use darker green
        } else if (!this.headerColor) {
          // For initial load, make the primary color darker
          headerColor = this.adjustColor(headerColor, -20);
        }
      }
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
          width: 400px;
          height: 620px;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.12),
            0 0 0 1px rgba(0, 0, 0, 0.03),
            0 8px 16px rgba(0, 0, 0, 0.08);
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          z-index: 10000;
          display: none;
          flex-direction: column;
          overflow: hidden;
          transform: translateY(20px) scale(0.95);
          opacity: 0;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .botrix-widget.open {
          transform: translateY(0) scale(1);
          opacity: 1;
        }

        .botrix-widget-header {
          background: linear-gradient(135deg, ${headerColor} 0%, ${this.adjustColor(headerColor, -30)} 100%);
          color: white;
          padding: 18px 20px;
          border-radius: 20px 20px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          box-shadow: 0 4px 20px ${this.adjustColor(headerColor, -20)}40;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .botrix-widget-header-info {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .botrix-widget-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          border: 2px solid rgba(255,255,255,0.25);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
        }

        .botrix-widget-title {
          font-weight: 700;
          font-size: 16px;
          margin-bottom: 3px;
          letter-spacing: -0.02em;
        }

        .botrix-widget-status {
          font-size: 12px;
          opacity: 0.95;
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
        }

        .botrix-status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ffffff;
          animation: pulse 2s infinite;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
        }

        @keyframes pulse {
          0%, 100% { 
            opacity: 1; 
            transform: scale(1);
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
          }
          50% { 
            opacity: 0.8; 
            transform: scale(1.1);
            box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2);
          }
        }

        .botrix-widget-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .botrix-control-btn {
          background: rgba(255,255,255,0.15);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .botrix-control-btn:hover {
          background: rgba(255,255,255,0.25);
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .botrix-control-btn.active {
          background: rgba(255,255,255,0.3);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .botrix-widget-messages {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          scroll-behavior: smooth;
          background: linear-gradient(180deg, #fafbfc 0%, #ffffff 100%);
        }

        .botrix-widget-messages::-webkit-scrollbar {
          width: 6px;
        }

        .botrix-widget-messages::-webkit-scrollbar-track {
          background: transparent;
        }

        .botrix-widget-messages::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }

        .botrix-widget-messages::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }

        .botrix-message {
          margin-bottom: 20px;
          display: flex;
          align-items: flex-end;
          gap: 10px;
          animation: messageSlide 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes messageSlide {
          from { 
            opacity: 0; 
            transform: translateY(15px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }

        .botrix-message.user {
          justify-content: flex-end;
        }

        .botrix-message.bot {
          justify-content: flex-start;
        }

        .botrix-message-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${headerColor} 0%, ${this.adjustColor(headerColor, -20)} 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.2);
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
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .botrix-message.user .botrix-message-bubble {
          background: linear-gradient(135deg, ${headerColor} 0%, ${this.adjustColor(headerColor, -20)} 100%);
          color: white;
          border-bottom-right-radius: 6px;
          box-shadow: 0 4px 12px ${this.adjustColor(headerColor, -20)}40;
        }

        .botrix-message.bot .botrix-message-bubble {
          background: #ffffff;
          color: #1f2937;
          border: 1px solid #e5e7eb;
          border-bottom-left-radius: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .botrix-message-time {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 6px;
          text-align: right;
          font-weight: 500;
        }

        .botrix-message.bot .botrix-message-time {
          text-align: left;
        }

        .botrix-typing {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 14px 18px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          border-bottom-left-radius: 6px;
          max-width: 70px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .botrix-typing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${headerColor};
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
            transform: scale(1.2);
            opacity: 1;
          }
        }

        .botrix-quick-replies {
          display: flex;
          gap: 10px;
          margin-top: 16px;
          flex-wrap: wrap;
          animation: quickRepliesSlide 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes quickRepliesSlide {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .botrix-quick-reply {
          background: #ffffff;
          border: 2px solid ${this.options.secondaryColor};
          color: ${this.options.secondaryColor};
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          min-height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .botrix-quick-reply:hover {
          background: ${this.options.secondaryColor};
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px ${this.options.secondaryColor}40;
        }

        .botrix-widget-input-container {
          padding: 20px;
          background: #ffffff;
          border-top: 1px solid #e5e7eb;
          border-radius: 20px 20px 20px 20px;
          box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.04);
        }

        .botrix-widget-input-row {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 28px;
          padding: 6px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .botrix-widget-input-row.focused {
          border-color: ${headerColor};
          box-shadow: 0 0 0 3px ${headerColor}15, 0 4px 12px rgba(0, 0, 0, 0.08);
          background: #ffffff;
        }

        .botrix-widget-input-row.listening {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08);
          animation: listening 1.5s infinite;
        }

        @keyframes listening {
          0%, 100% { 
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08); 
          }
          50% { 
            box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.2), 0 6px 16px rgba(0, 0, 0, 0.12); 
          }
        }

        .botrix-widget-input {
          flex: 1;
          padding: 12px 16px;
          border: none;
          outline: none;
          font-size: 14px;
          background: transparent;
          font-family: inherit;
          min-width: 0;
          color: #1f2937;
          font-weight: 500;
        }

        .botrix-widget-input::placeholder {
          color: #9ca3af;
          font-style: italic;
          font-weight: 400;
        }
        
        .botrix-widget-input:focus {
          outline: none;
        }
        
        .botrix-widget-input:focus::placeholder {
          opacity: 0.7;
        }

        .botrix-input-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-right: 6px;
          flex-shrink: 0;
        }

        .botrix-action-btn {
          background: transparent;
          border: none;
          color: #6b7280;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .botrix-action-btn:hover {
          background: #f3f4f6;
          color: #374151;
          transform: scale(1.05);
        }

        .botrix-action-btn.active {
          background: ${this.options.secondaryColor};
          color: white;
          box-shadow: 0 4px 12px ${this.options.secondaryColor}40;
        }

        .botrix-widget-send {
          background: linear-gradient(135deg, ${headerColor} 0%, ${this.adjustColor(headerColor, -20)} 100%);
          color: white;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          box-shadow: 0 4px 12px ${headerColor}40;
        }

        .botrix-widget-send:hover {
          background: linear-gradient(135deg, ${this.adjustColor(headerColor, -20)} 0%, ${this.adjustColor(headerColor, -40)} 100%);
          transform: scale(1.05);
          box-shadow: 0 6px 16px ${headerColor}50;
        }

        .botrix-widget-send:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
          opacity: 0.6;
          box-shadow: none;
        }

        .botrix-toggle-button {
          position: fixed;
          ${this.options.position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
          bottom: 20px;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, ${this.adjustColor(headerColor, -20)} 0%, ${this.adjustColor(headerColor, -50)} 100%);
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 24px;
          box-shadow: 0 16px 40px ${headerColor}60, 0 0 0 1px rgba(255, 255, 255, 0.15);
          z-index: 10001;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
        }

        .botrix-toggle-button:hover {
          transform: scale(1.1);
        }

        .botrix-toggle-button.pulse {
          animation: buttonPulse 2s infinite;
        }

        @keyframes buttonPulse {
          0%, 100% { 
            box-shadow: 0 16px 40px ${headerColor}60, 0 0 0 1px rgba(255, 255, 255, 0.15); 
          }
          50% { 
            box-shadow: 0 16px 40px ${headerColor}60, 0 0 0 1px rgba(255, 255, 255, 0.15), 0 0 0 12px ${headerColor}1a; 
          }
        }

        .botrix-widget-footer {
          text-align: center;
          font-size: 7px;
          color: #6b7280;
          padding: 8px 20px;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          border-top: 1px solid #e5e7eb;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .botrix-powered-logo {
          width: 70px;
          height: 25px;
          opacity: 0.8;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          filter: grayscale(0.2);
        }

        .botrix-powered-logo:hover {
          opacity: 1;
          transform: scale(1.05);
          filter: grayscale(0);
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
          top: -50px;
          right: 0;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 10px 16px;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 600;
          transform: translateY(-15px) scale(0.9);
          opacity: 0;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          letter-spacing: 0.02em;
        }

        .botrix-notification.show {
          transform: translateY(0) scale(1);
          opacity: 1;
        }

        /* Enhanced Responsive Design - Mobile First Approach */
        
        /* Large Desktop (1400px and above) */
        @media (min-width: 1400px) {
          .botrix-widget {
            width: 400px;
            height: 580px;
          }
          
          .botrix-widget-header {
            padding: 16px 20px;
          }
          
          .botrix-widget-avatar {
            width: 40px;
            height: 40px;
            font-size: 16px;
          }
          
          .botrix-widget-title {
            font-size: 16px;
          }
          
          .botrix-widget-messages {
            padding: 20px;
          }
          
          .botrix-message-bubble {
            padding: 12px 16px;
            font-size: 14px;
          }
          
          .botrix-widget-input-container {
            padding: 20px;
          }
          
          .botrix-widget-input {
            padding: 12px 16px;
            font-size: 14px;
          }
          
          .botrix-toggle-button {
            width: 60px;
            height: 60px;
            font-size: 24px;
          }
        }

        /* Desktop (1200px to 1399px) */
        @media (min-width: 1200px) and (max-width: 1399px) {
          .botrix-widget {
            width: 380px;
            height: 560px;
          }
          
          .botrix-widget-header {
            padding: 14px 18px;
          }
          
          .botrix-widget-avatar {
            width: 38px;
            height: 38px;
            font-size: 15px;
          }
          
          .botrix-widget-title {
            font-size: 15px;
          }
          
          .botrix-widget-messages {
            padding: 18px;
          }
          
          .botrix-message-bubble {
            padding: 11px 15px;
            font-size: 13px;
          }
          
          .botrix-widget-input-container {
            padding: 18px;
          }
          
          .botrix-widget-input {
            padding: 11px 15px;
            font-size: 13px;
          }
          
          .botrix-toggle-button {
            width: 58px;
            height: 58px;
            font-size: 22px;
          }
        }

        /* Small Desktop (1024px to 1199px) */
        @media (min-width: 1024px) and (max-width: 1199px) {
          .botrix-widget {
            width: 360px;
            height: 540px;
          }
          
          .botrix-widget-header {
            padding: 12px 16px;
          }
          
          .botrix-widget-avatar {
            width: 36px;
            height: 36px;
            font-size: 14px;
          }
          
          .botrix-widget-title {
            font-size: 14px;
          }
          
          .botrix-widget-messages {
            padding: 16px;
          }
          
          .botrix-message-bubble {
            padding: 10px 14px;
            font-size: 13px;
          }
          
          .botrix-widget-input-container {
            padding: 16px;
          }
          
          .botrix-widget-input {
            padding: 10px 14px;
            font-size: 13px;
          }
          
          .botrix-toggle-button {
            width: 56px;
            height: 56px;
            font-size: 22px;
          }
        }

        /* Tablet Landscape (768px to 1023px) */
        @media (min-width: 768px) and (max-width: 1023px) {
          .botrix-widget {
            width: calc(100vw - 40px);
            height: 500px;
            max-height: calc(100vh - 40px);
            bottom: 20px;
            left: 20px !important;
            right: 20px !important;
            border-radius: 16px;
          }
          
          .botrix-widget-header {
            padding: 12px 16px;
          }
          
          .botrix-widget-avatar {
            width: 34px;
            height: 34px;
            font-size: 13px;
          }
          
          .botrix-widget-title {
            font-size: 13px;
          }
          
          .botrix-widget-messages {
            padding: 16px;
          }
          
          .botrix-message-bubble {
            padding: 10px 14px;
            font-size: 12px;
          }
          
          .botrix-widget-input-container {
            padding: 16px;
          }
          
          .botrix-widget-input {
            padding: 10px 14px;
            font-size: 12px;
          }
          
          .botrix-toggle-button {
            width: 52px;
            height: 52px;
            font-size: 20px;
          }
        }

        /* Tablet Portrait (481px to 767px) */
        @media (min-width: 481px) and (max-width: 767px) {
          .botrix-widget {
            width: calc(100vw - 32px);
            height: 500px;
            max-height: calc(100vh - 32px);
            bottom: 16px;
            left: 16px !important;
            right: 16px !important;
            border-radius: 14px;
          }
          
          .botrix-widget-header {
            padding: 10px 14px;
          }
          
          .botrix-widget-avatar {
            width: 32px;
            height: 32px;
            font-size: 12px;
          }
          
          .botrix-widget-title {
            font-size: 12px;
          }
          
          .botrix-widget-messages {
            padding: 14px;
          }
          
          .botrix-message-bubble {
            padding: 9px 13px;
            font-size: 12px;
          }
          
          .botrix-widget-input-container {
            padding: 14px;
          }
          
          .botrix-widget-input {
            padding: 9px 13px;
            font-size: 12px;
          }
          
          .botrix-toggle-button {
            width: 48px;
            height: 48px;
            font-size: 18px;
          }
        }

        /* Mobile (480px and below) - Enhanced */
        @media (max-width: 480px) {
          .botrix-widget {
            width: calc(100vw - 16px);
            height: calc(100vh - 32px);
            max-height: 500px;
            bottom: 16px;
            left: 8px !important;
            right: 8px !important;
            border-radius: 18px;
            box-shadow: 0 15px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(255, 255, 255, 0.1);
          }
          
          .botrix-widget-header {
            padding: 12px 16px;
            border-radius: 18px 18px 0 0;
            min-height: 48px;
          }
          
          .botrix-widget-avatar {
            width: 32px;
            height: 32px;
            font-size: 13px;
          }
          
          .botrix-widget-title {
            font-size: 14px;
            font-weight: 700;
          }
          
          .botrix-widget-status {
            font-size: 11px;
          }
          
          .botrix-widget-messages {
            padding: 16px;
            flex: 1;
            min-height: 0;
          }
          
          .botrix-message-bubble {
            padding: 10px 14px;
            font-size: 13px;
            line-height: 1.5;
            max-width: 85%;
            border-radius: 16px;
          }
          
          .botrix-message.user .botrix-message-bubble {
            max-width: 85%;
            border-bottom-right-radius: 6px;
          }
          
          .botrix-message.bot .botrix-message-bubble {
            max-width: 85%;
            border-bottom-left-radius: 6px;
          }
          
          .botrix-widget-input-container {
            padding: 16px;
            border-radius: 0 0 18px 18px;
            border-top: 1px solid #e5e7eb;
          }
          
          .botrix-widget-input {
            padding: 10px 14px;
            font-size: 13px;
            min-height: 44px;
          }
          
          .botrix-widget-input-row {
            border-radius: 24px;
            padding: 4px;
          }
          
          .botrix-toggle-button {
            width: 52px;
            height: 52px;
            font-size: 20px;
            bottom: 16px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15), 0 0 0 1px rgba(255, 255, 255, 0.1);
          }
          
          .botrix-quick-reply {
            padding: 8px 12px;
            font-size: 11px;
            min-height: 36px;
            border-radius: 18px;
          }
          
          .botrix-quick-replies {
            gap: 8px;
            margin-top: 12px;
          }
          
          .botrix-action-btn {
            width: 32px;
            height: 32px;
            min-width: 32px;
            min-height: 32px;
          }
          
          .botrix-widget-send {
            width: 36px;
            height: 36px;
            min-width: 36px;
            min-height: 36px;
          }
        }

        /* Small Mobile (320px and below) - Enhanced */
        @media (max-width: 320px) {
          .botrix-widget {
            width: calc(100vw - 12px);
            height: calc(100vh - 24px);
            max-height: 400px;
            bottom: 12px;
            left: 6px !important;
            right: 6px !important;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.25);
          }
          
          .botrix-widget-header {
            padding: 8px;
            border-radius: 12px 12px 0 0;
            min-height: 38px;
          }
          
          .botrix-widget-avatar {
            width: 26px;
            height: 26px;
            font-size: 10px;
          }
          
          .botrix-widget-title {
            font-size: 11px;
            font-weight: 600;
          }
          
          .botrix-widget-status {
            font-size: 9px;
          }
          
          .botrix-widget-messages {
            padding: 8px;
            flex: 1;
            min-height: 0;
          }
          
          .botrix-message-bubble {
            padding: 6px 10px;
            font-size: 10px;
            line-height: 1.4;
            max-width: 90%;
          }
          
          .botrix-message.user .botrix-message-bubble {
            max-width: 90%;
          }
          
          .botrix-message.bot .botrix-message-bubble {
            max-width: 90%;
          }
          
          .botrix-widget-input-container {
            padding: 8px;
            border-radius: 0 0 12px 12px;
            border-top: 1px solid #e5e7eb;
          }
          
          .botrix-widget-input {
            padding: 6px 10px;
            font-size: 10px;
            min-height: 32px;
          }
          
          .botrix-widget-input-row {
            border-radius: 18px;
            padding: 2px;
          }
          
          .botrix-toggle-button {
            width: 40px;
            height: 40px;
            font-size: 14px;
            bottom: 12px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.25);
          }
          
          .botrix-quick-reply {
            padding: 4px 6px;
            font-size: 9px;
            min-height: 24px;
            border-radius: 12px;
          }
          
          .botrix-quick-replies {
            gap: 4px;
            margin-top: 8px;
          }
          
          .botrix-action-btn {
            width: 24px;
            height: 24px;
            min-width: 24px;
            min-height: 24px;
          }
          
          .botrix-widget-send {
            width: 34px;
            height: 34px;
            min-width: 34px;
            min-height: 34px;
          }
        }

        /* Landscape orientation adjustments for mobile - Enhanced */
        @media (max-width: 767px) and (orientation: landscape) {
          .botrix-widget {
            height: calc(100vh - 32px);
            max-height: 400px;
            width: calc(100vw - 32px);
            bottom: 16px;
            left: 16px !important;
            right: 16px !important;
          }
          
          .botrix-widget-header {
            padding: 6px 10px;
            min-height: 36px;
          }
          
          .botrix-widget-avatar {
            width: 28px;
            height: 28px;
            font-size: 11px;
          }
          
          .botrix-widget-title {
            font-size: 12px;
          }
          
          .botrix-widget-status {
            font-size: 10px;
          }
          
          .botrix-widget-messages {
            padding: 8px 12px;
            flex: 1;
            min-height: 0;
          }
          
          .botrix-message-bubble {
            padding: 6px 10px;
            font-size: 11px;
            max-width: 80%;
          }
          
          .botrix-widget-input-container {
            padding: 8px 12px;
            border-top: 1px solid #e5e7eb;
          }
          
          .botrix-widget-input {
            padding: 6px 10px;
            font-size: 11px;
            min-height: 32px;
          }
          
          .botrix-quick-reply {
            padding: 4px 8px;
            font-size: 10px;
            min-height: 28px;
          }
          
          .botrix-toggle-button {
            width: 44px;
            height: 44px;
            font-size: 16px;
            bottom: 12px;
          }
        }

        /* Touch-friendly improvements for mobile - Enhanced */
        @media (max-width: 767px) {
          .botrix-control-btn {
            min-width: 44px;
            min-height: 44px;
            touch-action: manipulation;
          }
          
          .botrix-quick-reply {
            min-height: 40px;
            padding: 8px 12px;
            touch-action: manipulation;
            user-select: none;
          }
          
          .botrix-widget-input {
            min-height: 44px;
            touch-action: manipulation;
          }
          
          .botrix-widget-send {
            min-width: 44px;
            min-height: 44px;
            touch-action: manipulation;
          }
          
          .botrix-action-btn {
            min-width: 44px;
            min-height: 44px;
            touch-action: manipulation;
          }
          
          .botrix-toggle-button {
            touch-action: manipulation;
          }
          
          /* Improve scrolling on mobile */
          .botrix-widget-messages {
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }
          
          /* Better focus states for accessibility */
          .botrix-widget-input:focus {
            outline: none;
            box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3);
          }
          
          .botrix-quick-reply:focus {
            outline: none;
            box-shadow: 0 0 0 2px rgba(236, 72, 153, 0.3);
          }
        }

        /* Ensure proper spacing on very small screens - Enhanced */
        @media (max-width: 360px) {
          .botrix-widget {
            width: calc(100vw - 8px);
            height: calc(100vh - 16px);
            max-height: 480px;
            bottom: 8px;
            left: 4px !important;
            right: 4px !important;
            border-radius: 12px;
          }
          
          .botrix-widget-header {
            padding: 8px;
            min-height: 44px;
          }
          
          .botrix-widget-messages {
            padding: 12px;
            flex: 1;
            min-height: 0;
          }
          
          .botrix-widget-input-container {
            padding: 12px;
            border-top: 1px solid #e5e7eb;
          }
          
          .botrix-widget-title {
            font-size: 13px;
            font-weight: 600;
          }
          
          .botrix-widget-status {
            font-size: 10px;
          }
          
          .botrix-widget-avatar {
            width: 28px;
            height: 28px;
            font-size: 12px;
          }
          
          .botrix-message-bubble {
            padding: 8px 12px;
            font-size: 12px;
            max-width: 92%;
          }
          
          .botrix-widget-input {
            padding: 8px 12px;
            font-size: 12px;
            min-height: 40px;
          }
          
          .botrix-toggle-button {
            width: 48px;
            height: 48px;
            font-size: 18px;
            bottom: 12px;
          }
        }
        
        /* Extra small screens (280px and below) */
        @media (max-width: 280px) {
          .botrix-widget {
            width: calc(100vw - 4px);
            height: calc(100vh - 8px);
            max-height: 450px;
            bottom: 4px;
            left: 2px !important;
            right: 2px !important;
            border-radius: 8px;
          }
          
          .botrix-widget-header {
            padding: 6px;
            min-height: 40px;
            border-radius: 8px 8px 0 0;
          }
          
          .botrix-widget-avatar {
            width: 28px;
            height: 28px;
            font-size: 12px;
          }
          
          .botrix-widget-title {
            font-size: 12px;
          }
          
          .botrix-widget-status {
            font-size: 9px;
          }
          
          .botrix-widget-messages {
            padding: 10px;
          }
          
          .botrix-message-bubble {
            padding: 6px 10px;
            font-size: 11px;
            max-width: 95%;
          }
          
          .botrix-widget-input-container {
            padding: 10px;
            border-radius: 0 0 8px 8px;
          }
          
          .botrix-widget-input {
            padding: 6px 10px;
            font-size: 11px;
            min-height: 36px;
          }
          
          .botrix-toggle-button {
            width: 44px;
            height: 44px;
            font-size: 16px;
            bottom: 8px;
          }
          
          .botrix-quick-reply {
            padding: 4px 8px;
            font-size: 10px;
            min-height: 32px;
          }
        }

        /* High DPI displays and better pixel density support */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .botrix-widget {
            border: 0.5px solid rgba(255,255,255,0.1);
          }
          
          .botrix-widget-header {
            border-bottom: 0.5px solid rgba(255,255,255,0.1);
          }
          
          .botrix-widget-input-container {
            border-top: 0.5px solid #e5e7eb;
          }
        }
        
        /* Ultra high DPI displays (3x and above) */
        @media (-webkit-min-device-pixel-ratio: 3), (min-resolution: 288dpi) {
          .botrix-widget {
            border: 0.33px solid rgba(255,255,255,0.1);
          }
          
          .botrix-widget-header {
            border-bottom: 0.33px solid rgba(255,255,255,0.1);
          }
          
          .botrix-widget-input-container {
            border-top: 0.33px solid #e5e7eb;
          }
        }
        
        /* Ensure proper scaling on all devices */
        @media screen and (max-width: 480px) {
          .botrix-widget {
            transform-origin: bottom right;
          }
          
          .botrix-widget.open {
            transform: translateY(0) scale(1);
          }
        }
        
        /* Handle viewport changes and orientation changes */
        @media screen and (orientation: portrait) and (max-width: 480px) {
          .botrix-widget {
            width: calc(100vw - 16px);
            height: calc(100vh - 32px);
            max-height: 540px;
          }
        }
        
        @media screen and (orientation: landscape) and (max-width: 767px) {
          .botrix-widget {
            width: calc(100vw - 32px);
            height: calc(100vh - 32px);
            max-height: 450px;
          }
        }
        
        /* Ensure proper positioning for different screen sizes */
        @media screen and (min-width: 481px) and (max-width: 767px) {
          .botrix-widget {
            ${this.options.position === 'bottom-left' ? 'left: 20px; right: auto;' : 'right: 20px; left: auto;'}
          }
        }
        
        /* Better handling for ultra-wide screens */
        @media screen and (min-width: 2000px) {
          .botrix-widget {
            width: 420px;
            height: 600px;
          }
          
          .botrix-widget-header {
            padding: 16px 20px;
          }
          
          .botrix-widget-avatar {
            width: 42px;
            height: 42px;
            font-size: 16px;
          }
          
          .botrix-widget-title {
            font-size: 16px;
          }
          
          .botrix-widget-messages {
            padding: 20px;
          }
          
          .botrix-message-bubble {
            padding: 12px 16px;
            font-size: 14px;
          }
          
          .botrix-widget-input-container {
            padding: 20px;
          }
          
          .botrix-widget-input {
            padding: 12px 16px;
            font-size: 14px;
          }
          
          .botrix-toggle-button {
            width: 64px;
            height: 64px;
            font-size: 26px;
          }
        }

        /* Extra small screens (280px and below) */
        @media (max-width: 280px) {
          .botrix-widget {
            width: calc(100vw - 8px);
            height: calc(100vh - 16px);
            max-height: 420px;
            bottom: 8px;
            left: 4px !important;
            right: 4px !important;
            border-radius: 10px;
          }
          
          .botrix-widget-header {
            padding: 6px;
            border-radius: 10px 10px 0 0;
            min-height: 32px;
          }
          
          .botrix-widget-avatar {
            width: 22px;
            height: 22px;
            font-size: 9px;
          }
          
          .botrix-widget-title {
            font-size: 10px;
          }
          
          .botrix-widget-status {
            font-size: 8px;
          }
          
          .botrix-widget-messages {
            padding: 6px;
          }
          
          .botrix-message-bubble {
            padding: 4px 8px;
            font-size: 9px;
            max-width: 92%;
          }
          
          .botrix-widget-input-container {
            padding: 6px;
            border-radius: 0 0 10px 10px;
          }
          
          .botrix-widget-input {
            padding: 4px 8px;
            font-size: 9px;
            min-height: 28px;
          }
          
          .botrix-toggle-button {
            width: 36px;
            height: 36px;
            font-size: 12px;
            bottom: 8px;
          }
          
          .botrix-quick-reply {
            padding: 3px 5px;
            font-size: 8px;
            min-height: 20px;
          }
        }
        
        /* Prevent zoom on input focus for iOS */
        @media screen and (max-width: 480px) {
          .botrix-widget-input {
            font-size: 16px !important;
          }
        }
        
        /* Additional responsive improvements */
        
        /* Ensure proper viewport handling */
        @supports (height: 100dvh) {
          .botrix-widget {
            height: 540px;
            max-height: calc(100dvh - 40px);
          }
          
          @media (max-width: 480px) {
            .botrix-widget {
              height: calc(100dvh - 32px);
              max-height: 540px;
            }
          }
          
          @media (max-width: 320px) {
            .botrix-widget {
              height: calc(100dvh - 24px);
              max-height: 460px;
            }
          }
        }
        
        /* Better accessibility for screen readers */
        @media (prefers-reduced-motion: reduce) {
          .botrix-widget,
          .botrix-toggle-button,
          .botrix-quick-reply,
          .botrix-action-btn,
          .botrix-widget-send {
            transition: none !important;
            animation: none !important;
          }
          
          .botrix-widget.open {
            transform: translateY(0) scale(1) !important;
          }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .botrix-widget {
            box-shadow: 0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1);
          }
          
          .botrix-widget-messages {
            background: #f9fafb;
            color: #1f2937;
          }
          
          .botrix-message.bot .botrix-message-bubble {
            background: #f9fafb;
            color: #1f2937;
            border-color: #f9fafbx;
          }
          
          .botrix-widget-input-container {
            background: #ffffff;
            border-top-color: #e5e7eb;
          }
          
          .botrix-widget-input {
            background: #f9fafb;
            color: #1f2937;
          }
          
          .botrix-widget-input::placeholder {
            color: #9ca3af;
          }
          
          .botrix-widget-input-row {
            background: #f9fafb;
            border-color: #e5e7eb;
          }
        }
        
        /* Ensure proper contrast ratios */
        @media (prefers-contrast: high) {
          .botrix-widget {
            border: 2px solid #000000;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          }
          
          .botrix-widget-header {
            border-bottom: 2px solid #ffffff;
          }
          
          .botrix-widget-input-container {
            border-top: 2px solid #000000;
          }
          
          .botrix-quick-reply {
            border: 2px solid #000000;
            background: #ffffff;
            color: #000000;
          }
        }

        /* Toggle button icon styles */
        .botrix-toggle-icon-emoji {
          font-size: 24px;
          line-height: 1;
        }

        .botrix-toggle-icon-custom {
          width: 24px;
          height: 24px;
          object-fit: contain;
        }

        .botrix-toggle-icon-svg {
          width: 24px;
          height: 24px;
        }

        /* Responsive toggle button icons */
        @media (min-width: 1200px) {
          .botrix-toggle-icon-emoji {
            font-size: 28px;
          }
          
          .botrix-toggle-icon-custom {
            width: 28px;
            height: 28px;
          }
          
          .botrix-toggle-icon-svg {
            width: 28px;
            height: 28px;
          }
        }

        @media (max-width: 1199px) and (min-width: 1024px) {
          .botrix-toggle-icon-emoji {
            font-size: 26px;
          }
          
          .botrix-toggle-icon-custom {
            width: 26px;
            height: 26px;
          }
          
          .botrix-toggle-icon-svg {
            width: 26px;
            height: 26px;
          }
        }

        @media (max-width: 1023px) and (min-width: 768px) {
          .botrix-toggle-icon-emoji {
            font-size: 24px;
          }
          
          .botrix-toggle-icon-custom {
            width: 24px;
            height: 24px;
          }
          
          .botrix-toggle-icon-svg {
            width: 24px;
            height: 24px;
          }
        }

        @media (max-width: 767px) and (min-width: 481px) {
          .botrix-toggle-icon-emoji {
            font-size: 22px;
          }
          
          .botrix-toggle-icon-custom {
            width: 22px;
            height: 22px;
          }
          
          .botrix-toggle-icon-svg {
            width: 22px;
            height: 22px;
          }
        }

        @media (max-width: 480px) {
          .botrix-toggle-icon-emoji {
            font-size: 20px;
          }
          
          .botrix-toggle-icon-custom {
            width: 20px;
            height: 20px;
          }
          
          .botrix-toggle-icon-svg {
            width: 20px;
            height: 20px;
          }
        }

        @media (max-width: 320px) {
          .botrix-toggle-icon-emoji {
            font-size: 18px;
          }
          
          .botrix-toggle-icon-custom {
            width: 18px;
            height: 18px;
          }
          
          .botrix-toggle-icon-svg {
            width: 18px;
            height: 18px;
          }
        }

        /* Popup styles */
        .botrix-minimized-popup {
          position: fixed;
          background: linear-gradient(135deg, ${this.adjustColor(headerColor, -20)} 0%, ${this.adjustColor(headerColor, -50)} 100%);
          color: white;
          border-radius: 24px;
          box-shadow: 
            0 16px 40px ${headerColor}50,
            0 0 0 1px rgba(255, 255, 255, 0.25),
            0 6px 20px rgba(0, 0, 0, 0.15);
          padding: 14px 22px;
          font-size: 15px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          z-index: 10002;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 1;
          min-width: 160px;
          max-width: 260px;
          user-select: none;
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          letter-spacing: 0.02em;
        }
        
        .botrix-minimized-popup:hover {
          transform: translateY(-3px) scale(1.03);
        }
        
        .botrix-minimized-popup .botrix-popup-close {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          font-size: 18px;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          cursor: pointer;
          display: none;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(255,255,255,0.25);
          backdrop-filter: blur(10px);
        }
        
        .botrix-minimized-popup .botrix-popup-close:hover {
          background: rgba(255,255,255,0.3);
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
              <polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
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
        <span style="font-weight: 700; font-size: 12px; color: #6b7280; text-transform: lowercase; letter-spacing: 0.8px; opacity: 0.8;">powered by</span>
        <img src="${this.options.baseUrl}/botrix-logo01.png" alt="BotrixAI" class="botrix-powered-logo" style="cursor: pointer; width: 70px; height: 25px; margin-left: 4px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);"/>
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
      
      // Add click event to logo for BotrixAI website redirect
      const logoElement = footer.querySelector('.botrix-powered-logo');
      if (logoElement) {
        logoElement.addEventListener('click', () => {
          // Redirect to BotrixAI website
          window.open('https://www.botrixai.com/', '_blank');
        });
        
        // Add hover effect
        logoElement.addEventListener('mouseenter', () => {
          logoElement.style.transform = 'scale(1.05)';
        });
        
        logoElement.addEventListener('mouseleave', () => {
          logoElement.style.transform = 'scale(1)';
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
          iconHtml = `<span class="botrix-toggle-icon-emoji">${iconEmoji}</span>`;
          break;
        case 'custom':
          if (iconUrl) {
            iconHtml = `<img src="${iconUrl}" alt="Custom Icon" class="botrix-toggle-icon-custom" />`;
          } else {
            // Fallback to default
            iconHtml = `
              <svg class="botrix-toggle-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            `;
          }
          break;
        default:
          iconHtml = `
            <svg class="botrix-toggle-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
        nameDiv.style.marginBottom = '3px';
        nameDiv.style.fontWeight = '600';
        nameDiv.style.opacity = '0.9';
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