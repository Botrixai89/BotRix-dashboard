# BotRix Dashboard - Intelligent Chatbot Platform

BotRix is a comprehensive AI chatbot platform that allows businesses to build, deploy, and manage intelligent chatbots with no coding required. The platform provides a complete solution for creating conversational AI experiences with advanced features like voice integration, real-time messaging, analytics, and webhook support.

## 🚀 Features

### Core Functionality
- **Bot Builder**: Visual flow builder for creating conversational experiences
- **Real-time Chat**: Live messaging with Socket.IO integration
- **Voice Integration**: Text-to-speech and speech-to-text capabilities
- **Analytics Dashboard**: Comprehensive metrics and insights
- **Webhook Support**: Integration with external AI services
- **Widget Embedding**: Easy integration into any website
- **User Management**: Authentication with Google OAuth and email/password
- **File Upload**: Image and logo management with Cloudinary support

### Advanced Features
- **Multi-modal Conversations**: Support for text, images, and voice
- **Conversation Management**: Track and manage all user interactions
- **Customizable Widgets**: Theme customization and branding options
- **Team Collaboration**: Multi-user support with role-based access
- **API Integration**: RESTful API for external integrations
- **Real-time Notifications**: Live updates and alerts
- **Export & Analytics**: Data export and detailed reporting

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with Google OAuth
- **Real-time**: Socket.IO
- **Styling**: Tailwind CSS, Radix UI components
- **Voice**: Google Cloud Speech APIs
- **File Storage**: Cloudinary (production), local filesystem (development)
- **Deployment**: Vercel-ready

### Project Structure
```
BotRix-dashboard/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── bots/                 # Bot management API
│   │   ├── chat/                 # Chat processing API
│   │   ├── upload/               # File upload API
│   │   ├── voice/                # Voice processing API
│   │   └── socket/               # Socket.IO integration
│   ├── dashboard/                # Main dashboard pages
│   │   ├── bots/                 # Bot management interface
│   │   ├── account-settings/     # User account management
│   │   └── team/                 # Team collaboration
│   ├── login/                    # Authentication pages
│   └── layout.tsx                # Root layout
├── components/                   # Reusable UI components
│   ├── ui/                       # Base UI components
│   └── [feature-components]      # Feature-specific components
├── lib/                          # Utility libraries
│   ├── auth.ts                   # Authentication utilities
│   ├── chat-service.ts           # Chat processing logic
│   ├── voice-service.ts          # Voice processing
│   ├── socket-server.ts          # Socket.IO server
│   └── mongodb.ts                # Database connection
├── models/                       # MongoDB schemas
├── public/                       # Static assets
│   └── widget.js                 # Embeddable chat widget
└── types/                        # TypeScript type definitions
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ 
- MongoDB database
- Google Cloud account (for voice features)
- Cloudinary account (for file uploads)

### Environment Variables
Create a `.env.local` file based on `env.example`:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/botrix-dashboard

# Authentication
JWT_SECRET=your-super-secret-jwt-key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Cloudinary (File Uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Cloud Voice APIs
GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key
NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Installation Steps
```bash
# Clone the repository
git clone <repository-url>
cd BotRix-dashboard

# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your configuration

# Run setup script
npm run setup

# Start development server
npm run dev
```

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/signup`
Create a new user account
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### POST `/api/auth/login`
Authenticate user
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

### Bot Management API

#### GET `/api/bots`
Retrieve all bots for authenticated user

#### POST `/api/bots`
Create a new bot
```json
{
  "name": "Customer Support Bot",
  "description": "AI-powered customer support",
  "webhookUrl": "https://api.openai.com/v1/chat/completions",
  "welcomeMessage": "Hello! How can I help you today?",
  "primaryColor": "#8b5cf6"
}
```

#### GET `/api/bots/[id]`
Get specific bot details

#### PUT `/api/bots/[id]`
Update bot configuration

#### DELETE `/api/bots/[id]`
Delete a bot

### Chat API

#### POST `/api/chat`
Process chat messages
```json
{
  "type": "text",
  "content": {
    "text": "Hello, I need help"
  },
  "_botId": "bot_id_here",
  "_conversationId": "conversation_id_here",
  "_userInfo": {
    "ip": "client-ip",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### Voice API

#### POST `/api/voice/text-to-speech`
Convert text to speech
```json
{
  "text": "Hello, how can I help you?",
  "settings": {
    "voice": "alloy",
    "speed": 1.0,
    "pitch": 1.0,
    "language": "en-US"
  },
  "apiKey": "google_cloud_api_key"
}
```

#### POST `/api/voice/speech-to-text`
Convert speech to text
```form-data
audio: [audio_file]
apiKey: "google_cloud_api_key"
```

### File Upload API

#### POST `/api/upload`
Upload images and files
```form-data
file: [image_file]
```

## 🤖 Bot Configuration

### Bot Settings Schema
```typescript
interface BotSettings {
  welcomeMessage: string;
  fallbackMessage: string;
  primaryColor: string;
  webhookUrl: string;
  collectUserInfo: boolean;
  handoverEnabled: boolean;
  
  // Widget customization
  widgetIcon?: string;
  widgetIconType: 'default' | 'custom' | 'emoji';
  widgetIconEmoji: string;
  theme: 'modern' | 'minimal' | 'gradient';
  
  // Voice settings
  voiceEnabled: boolean;
  voiceSettings: {
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
    speed: number;
    pitch: number;
    language: string;
  };
}
```

### Webhook Integration
Bots can integrate with external AI services via webhooks:

```javascript
// Example webhook payload
{
  "action": "sendMessage",
  "sessionId": "widget_botId_timestamp",
  "chatInput": "user message",
  "message": "user message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}

// Expected response format
{
  "output": "Bot response message"
}
```

## 🎨 Widget Integration

### Basic Integration
```html
<script src="https://your-domain.com/widget.js"></script>
<script>
  window.BotrixChat.createWidget('bot_id', {
    primaryColor: '#8b5cf6',
    position: 'bottom-right',
    welcomeMessage: 'Hello! How can I help you?'
  });
</script>
```

### Advanced Integration
```html
<script 
  src="https://your-domain.com/widget.js"
  data-botrix-bot-id="bot_id"
  data-botrix-primary-color="#8b5cf6"
  data-botrix-position="bottom-right"
  data-botrix-welcome-message="Hello! How can I help you?"
  data-botrix-theme="modern"
  async>
</script>
```

## 📊 Analytics & Metrics

### Available Metrics
- **Conversation Analytics**: Total conversations, new messages, response times
- **User Engagement**: Unique users, active users, session duration
- **Performance Metrics**: Resolution rates, handover rates, satisfaction scores
- **Real-time Data**: Live conversation tracking and monitoring

### Analytics Dashboard Features
- Interactive charts and graphs
- Date range filtering
- Export capabilities
- Real-time updates
- Performance insights

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication
- Google OAuth integration
- Password hashing with bcrypt
- Account lockout protection
- Session management

### Data Protection
- Input validation and sanitization
- CORS configuration
- Rate limiting
- Secure file upload validation
- Environment variable protection

## 🚀 Deployment

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Testing

### Available Test Scripts
```bash
# Run linting
npm run lint

# Run tests
npm test

# Environment setup
npm run setup
```

### Test Pages
- `/test-auth` - Authentication testing
- `/test-env` - Environment variable testing
- `/test-webhook` - Webhook integration testing
- `/test-upload` - File upload testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the test pages for debugging

## 🔄 Version History

- **v0.1.0**: Initial release with core chatbot functionality
- Features: Bot builder, chat API, widget integration, basic analytics
- Upcoming: Advanced flow builder, team collaboration, enhanced analytics

---

**BotRix Dashboard** - Building the future of conversational AI, one bot at a time. 🤖✨
