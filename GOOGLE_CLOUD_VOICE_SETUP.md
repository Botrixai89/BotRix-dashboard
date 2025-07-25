# Google Cloud Voice Integration Setup

This guide will help you set up Google Cloud Text-to-Speech and Speech-to-Text APIs for enhanced voice communication in your Botrix chatbot.

## 🎯 Overview

The enhanced voice system provides:
- **High-quality Text-to-Speech** using Google Cloud Neural2 voices
- **Accurate Speech-to-Text** with automatic punctuation and confidence scoring
- **Automatic fallback** to browser APIs if Google Cloud is unavailable
- **Free tier usage** with generous limits

## 🚀 Quick Setup

### 1. Google Cloud Project Setup

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable billing (required for API usage)

2. **Enable Required APIs**
   ```bash
   # Enable Text-to-Speech API
   gcloud services enable texttospeech.googleapis.com
   
   # Enable Speech-to-Text API
   gcloud services enable speech.googleapis.com
   ```

3. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key
   - (Optional) Restrict the key to only Text-to-Speech and Speech-to-Text APIs

### 2. Environment Configuration

Add your Google Cloud API key to your environment variables:

```env
# .env.local
GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key_here
NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key_here
```

### 3. Install Dependencies

```bash
npm install @google-cloud/text-to-speech @google-cloud/speech
```

## 🎤 Features

### Text-to-Speech (TTS)

**Available Voices:**
- **Alloy** (en-US-Neural2-A) - Professional, clear
- **Echo** (en-US-Neural2-C) - Warm, friendly
- **Fable** (en-US-Neural2-D) - Storytelling, expressive
- **Onyx** (en-US-Neural2-E) - Deep, authoritative
- **Nova** (en-US-Neural2-F) - Bright, energetic
- **Shimmer** (en-US-Neural2-G) - Soft, gentle

**Customizable Settings:**
- **Speed**: 0.25x to 4.0x
- **Pitch**: -20.0 to +20.0
- **Language**: Multiple languages supported
- **Audio Format**: MP3 with high quality

### Speech-to-Text (STT)

**Features:**
- **Automatic Punctuation**: Adds commas, periods, question marks
- **Confidence Scoring**: Returns confidence level for each transcription
- **Enhanced Models**: Uses Google's latest neural models
- **Multiple Languages**: Supports 120+ languages
- **Real-time Processing**: Low latency transcription

## 💰 Pricing & Limits

### Free Tier (Monthly)
- **Text-to-Speech**: 4 million characters
- **Speech-to-Text**: 60 minutes of audio

### Paid Tier (After Free Tier)
- **Text-to-Speech**: $4.00 per 1 million characters
- **Speech-to-Text**: $0.006 per 15 seconds

*Note: Prices may vary by region. Check [Google Cloud Pricing](https://cloud.google.com/pricing) for current rates.*

## 🔧 API Endpoints

### Text-to-Speech
```
POST /api/voice/text-to-speech
Content-Type: application/json

{
  "text": "Hello, how can I help you today?",
  "settings": {
    "voice": "alloy",
    "speed": 1.0,
    "pitch": 0,
    "language": "en-US"
  },
  "apiKey": "your_api_key"
}
```

### Speech-to-Text
```
POST /api/voice/speech-to-text
Content-Type: multipart/form-data

Form Data:
- audio: [audio file blob]
- apiKey: "your_api_key"
```

### Check Support
```
GET /api/voice/check-support
```

### Get Available Voices
```
GET /api/voice/voices?apiKey=your_api_key
```

## 🎮 Usage in Widget

The widget automatically detects Google Cloud availability and falls back to browser APIs if needed:

```javascript
// Initialize voice service
const voiceService = new VoiceService();

// Check if Google Cloud is available
await voiceService.checkGoogleCloudSupport();

// Speak text (automatically uses best available service)
await voiceService.speak("Hello, how can I help you?");

// Start listening (automatically uses best available service)
const transcript = await voiceService.startListening();
```

## 🔄 Fallback System

The system automatically falls back to browser APIs if:
- Google Cloud API key is not configured
- API key is invalid or expired
- Network issues prevent API access
- Rate limits are exceeded

**Fallback Priority:**
1. Google Cloud Text-to-Speech/Speech-to-Text
2. Browser Web Speech API
3. No voice functionality

## 🛡️ Security

### API Key Security
- Store API keys in environment variables
- Never expose keys in client-side code
- Use API key restrictions in Google Cloud Console
- Monitor API usage regularly

### Audio Privacy
- Audio is processed server-side
- No audio data is stored permanently
- All audio processing is done through Google's secure APIs

## 📊 Monitoring

### Google Cloud Console
- Monitor API usage in Google Cloud Console
- Set up billing alerts
- View API quotas and limits

### Application Logs
The application logs voice API usage:
```
🎤 Google Cloud TTS Request: { text: "Hello...", voice: "en-US-Neural2-A" }
✅ Google Cloud TTS Success: { audioSize: 12345, voice: "en-US-Neural2-A" }
🎙️ Google Cloud STT Request: { fileName: "recording.wav", fileSize: 12345 }
✅ Google Cloud STT Success: { transcript: "Hello...", confidence: 0.95 }
```

## 🐛 Troubleshooting

### Common Issues

**1. "API key not configured"**
- Check environment variables
- Ensure API key is properly set
- Restart the development server

**2. "Invalid API key"**
- Verify API key in Google Cloud Console
- Check if APIs are enabled
- Ensure billing is enabled

**3. "Rate limit exceeded"**
- Check current usage in Google Cloud Console
- Wait for quota reset or upgrade plan
- Implement rate limiting in your application

**4. "Audio not playing"**
- Check browser audio permissions
- Ensure audio context is initialized
- Check for CORS issues

### Debug Mode

Enable debug logging by setting:
```env
DEBUG_VOICE=true
```

## 🔮 Future Enhancements

Planned features:
- **Voice Cloning**: Custom voice training
- **Emotion Detection**: Sentiment-aware responses
- **Multi-language Support**: Automatic language detection
- **Voice Commands**: Custom voice triggers
- **Audio Effects**: Background music, sound effects

## 📞 Support

For issues with:
- **Google Cloud APIs**: [Google Cloud Support](https://cloud.google.com/support)
- **Botrix Integration**: Check this documentation or create an issue
- **Billing**: [Google Cloud Billing Support](https://cloud.google.com/billing/docs/support)

## 📚 Additional Resources

- [Google Cloud Text-to-Speech Documentation](https://cloud.google.com/text-to-speech/docs)
- [Google Cloud Speech-to-Text Documentation](https://cloud.google.com/speech-to-text/docs)
- [Google Cloud Pricing Calculator](https://cloud.google.com/products/calculator)
- [API Quotas and Limits](https://cloud.google.com/apis/design/quotas) 