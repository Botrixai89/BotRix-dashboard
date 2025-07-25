# Botrix Dashboard

A comprehensive chatbot management platform built with Next.js, featuring AI-powered conversations, voice capabilities, and advanced analytics.

## Features

- 🤖 **AI Chatbot Management** - Create and manage multiple chatbots
- 🎨 **Customizable Widgets** - Brand your chat widgets with custom colors and logos
- 🗣️ **Voice Integration** - Text-to-speech and speech-to-text capabilities
- 📊 **Analytics Dashboard** - Track conversation metrics and performance
- 🔗 **Webhook Integration** - Connect with external automation services
- 👥 **Team Management** - Collaborate with team members
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB database
- (Optional) Google Cloud API key for enhanced voice features

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
   
   Edit `.env.local` with your configuration:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/botrix-dashboard
   
   # Authentication
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   
   # Base URL (for production)
   NEXT_PUBLIC_BASE_URL=https://your-domain.com
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## File Upload Configuration

### Development
In development, files are stored locally in the `public/uploads` directory.

### Production (Vercel)
In production on Vercel, the filesystem is read-only. The application automatically converts uploaded images to base64 data URLs, which are stored directly in the database.

**For better performance in production, consider using a cloud storage service:**

1. **Cloudinary (Recommended)**
   - Sign up at [cloudinary.com](https://cloudinary.com)
   - Add environment variables:
     ```env
     CLOUDINARY_CLOUD_NAME=your_cloud_name
     CLOUDINARY_UPLOAD_PRESET=your_upload_preset
     ```

2. **AWS S3**
   - Set up an S3 bucket
   - Configure AWS credentials
   - Update the upload service to use S3

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `NEXT_PUBLIC_BASE_URL` | Your application's base URL | Yes (production) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | No |
| `CLOUDINARY_UPLOAD_PRESET` | Cloudinary upload preset | No |
| `GOOGLE_CLOUD_API_KEY` | Google Cloud API key for voice features | No |

## Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables** in Vercel dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_BASE_URL` (your production domain)
3. **Deploy**

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Bots
- `GET /api/bots` - List user's bots
- `POST /api/bots` - Create new bot
- `GET /api/bots/[id]` - Get bot details
- `PUT /api/bots/[id]` - Update bot
- `DELETE /api/bots/[id]` - Delete bot

### Chat
- `POST /api/chat` - Send message to bot
- `GET /api/bots/[id]/conversations` - Get bot conversations

### File Upload
- `POST /api/upload` - Upload files (images)

## Widget Integration

Add the chat widget to your website:

```html
<script src="https://your-domain.com/widget.js" 
        data-botrix-bot-id="your-bot-id"
        data-botrix-primary-color="#8b5cf6"
        data-botrix-position="bottom-right">
</script>
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@botrixai.com or create an issue in this repository. 