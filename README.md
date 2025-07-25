# Botrix Dashboard

A comprehensive chatbot platform built with Next.js, TypeScript, Tailwind CSS, and MongoDB. Create, manage, and analyze chatbots with a modern, user-friendly interface.

## 🚀 Features

### Phase 1 - MVP (Current)
- **User Authentication**: Sign up, login, and account management
- **Bot Management**: Create and manage multiple chatbots
- **Dashboard**: Overview with bot cards and key metrics
- **Bot Builder**: Simple Q&A setup for common questions
- **Live Chat Inbox**: Real-time conversation management with filtering
- **Analytics**: Performance metrics and user engagement tracking
- **Embed Code**: Easy website integration with customizable widget
- **Voice Synthesis**: Text-to-speech functionality with customizable voices
- **Modern UI**: Built with Shadcn/UI and Tailwind CSS

### Phase 2 - Enhanced Features (Planned)
- **Advanced Bot Builder**: Visual flow builder with drag-and-drop
- **Team Collaboration**: Multi-user support with roles and permissions
- **AI Integration**: Natural Language Processing for smarter responses
- **Advanced Analytics**: Detailed reports and goal tracking
- **Integrations**: Webhooks, Zapier, Slack, and CRM connections

## 🎤 Voice Features

### Enhanced Voice Integration with Google Cloud
Botrix now includes comprehensive voice synthesis and recognition capabilities with Google Cloud integration:

- **High-Quality Text-to-Speech**: Google Cloud Neural2 voices for natural-sounding speech
- **Accurate Speech-to-Text**: Advanced speech recognition with automatic punctuation
- **Multiple Voice Types**: Choose from 6 different voice personalities (Alloy, Echo, Fable, Onyx, Nova, Shimmer)
- **Customizable Settings**: Adjust speed (0.25x - 4.0x), pitch (-20 to +20), and language
- **Multi-language Support**: 120+ languages supported through Google Cloud
- **Real-time Voice**: Bot responses are automatically spoken aloud when enabled
- **Voice Controls**: Users can toggle voice on/off in the chat widget
- **Automatic Fallback**: Falls back to browser APIs if Google Cloud is unavailable
- **Free Tier**: 4M characters TTS, 60min STT per month

### Google Cloud Setup
1. **Get Google Cloud API Key**: Follow the setup guide in `GOOGLE_CLOUD_VOICE_SETUP.md`
2. **Add Environment Variables**: Add your API key to `.env.local`
3. **Install Dependencies**: Run `npm install @google-cloud/text-to-speech @google-cloud/speech`
4. **Test Integration**: Visit `/google-voice-test.html` to test the voice features

### How to Enable Voice
1. Go to your bot's Builder page
2. Scroll to the "Voice Settings" section
3. Enable "Voice Responses"
4. Choose your preferred voice type and settings
5. Test the voice with the preview button
6. Save your settings

### Voice Testing
- **Browser Voice**: Visit `/voice-test.html` to test browser-based voice features
- **Google Cloud Voice**: Visit `/google-voice-test.html` to test Google Cloud voice features

## 🛠️ Tech Stack

- **Frontend & Backend**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/UI components
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Real-time**: Socket.io
- **Deployment**: Vercel-ready

## 📁 Project Structure

```
botrix-dashboard/
├── app/                          # Next.js App Router
│   ├── dashboard/               # Dashboard pages
│   │   ├── bots/[id]/          # Bot-specific pages
│   │   │   ├── analytics/      # Analytics page
│   │   │   ├── builder/        # Bot builder
│   │   │   ├── embed/          # Embed code
│   │   │   ├── messages/       # Chat inbox
│   │   │   └── page.tsx        # Bot overview
│   │   ├── create-bot/         # Bot creation
│   │   └── page.tsx            # Main dashboard
│   ├── login/                   # Authentication
│   ├── signup/                  # Registration
│   ├── globals.css             # Global styles
│   └── layout.tsx              # Root layout
├── components/
│   └── ui/                     # Shadcn/UI components
├── lib/
│   ├── mongodb.ts              # Database connection
│   └── utils.ts                # Utility functions
├── models/                     # MongoDB models
│   ├── User.ts
│   ├── Bot.ts
│   └── Conversation.ts
└── types/
    └── index.ts                # TypeScript definitions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd botrix-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your values:
   ```env
   MONGODB_URI=mongodb://localhost:27017/botrix-dashboard
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   SOCKET_PORT=3001
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗃️ Database Setup

### MongoDB Local Setup
```bash
# Install MongoDB
brew install mongodb/brew/mongodb-community

# Start MongoDB
brew services start mongodb/brew/mongodb-community

# Create database
mongosh
use botrix-dashboard
```

### MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create new cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env.local`

## 📖 Usage Guide

### Creating Your First Bot

1. **Sign up** for a new account
2. **Navigate** to the dashboard
3. **Click** "Create New Bot"
4. **Fill in** bot information:
   - Bot Name (e.g., "Customer Support Bot")
   - Description (optional)
   - Welcome Message
   - Primary Color

5. **Set up responses** in the Bot Builder:
   - Add trigger keywords (e.g., "hello, hi, hey")
   - Define bot responses
   - Configure fallback message

6. **Test your bot** using the preview feature
7. **Get embed code** and add to your website
8. **Monitor conversations** in the Messages inbox

### Key Features Walkthrough

#### Dashboard
- View all your bots in card format
- See key metrics at a glance
- Quick access to bot management

#### Bot Builder (MVP)
- Simple Q&A setup
- Keyword-based triggers
- Welcome and fallback messages
- Quick response management

#### Messages Inbox
- Filter conversations (All, Active, New, Unassigned)
- Real-time chat interface
- User information sidebar
- Conversation assignment

#### Analytics
- Performance metrics
- User engagement data
- Conversation volume charts
- Most common questions

#### Embed Code
- Copy-paste integration
- Customizable widget settings
- Platform-specific instructions
- Live preview

## 🎨 Customization

### Styling
The project uses Tailwind CSS with Shadcn/UI components. Customize:

- **Colors**: Update `tailwind.config.js`
- **Components**: Modify files in `components/ui/`
- **Global styles**: Edit `app/globals.css`

### Database Schema
Extend models in the `models/` directory:

- **User**: Authentication and profile data
- **Bot**: Bot configuration and settings
- **Conversation**: Chat messages and metadata

## 🚀 Deployment

### Vercel Deployment
1. **Push to GitHub**
2. **Connect to Vercel**
3. **Set environment variables** in Vercel dashboard
4. **Deploy automatically** on every push

### Environment Variables for Production
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/botrix-dashboard
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-production-secret-key
```

## 🔧 Development

### Available Scripts
```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Code Quality
- **TypeScript**: Full type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting (add if needed)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Shadcn/UI](https://ui.shadcn.com/) for beautiful components
- [Next.js](https://nextjs.org/) for the amazing framework
- [Tailwind CSS](https://tailwindcss.com/) for utility-first CSS
- [MongoDB](https://www.mongodb.com/) for flexible database
- Inspired by platforms like ChatBot, Intercom, and Zendesk Chat

## 📞 Support

- **Documentation**: Check this README and inline comments
- **Issues**: Create GitHub issue for bugs
- **Discussions**: Use GitHub Discussions for questions
- **Email**: [your-email@domain.com](mailto:your-email@domain.com)

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies. 