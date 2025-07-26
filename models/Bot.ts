import mongoose, { Schema, model } from 'mongoose';

const BotSettingsSchema = new Schema({
  welcomeMessage: {
    type: String,
    default: 'Hello! How can I help you today?',
  },
  primaryColor: {
    type: String,
    default: '#2563eb',
  },
  fallbackMessage: {
    type: String,
    default: "I'm sorry, I didn't understand that. Can you please rephrase?",
  },
  collectUserInfo: {
    type: Boolean,
    default: false,
  },
  handoverEnabled: {
    type: Boolean,
    default: true,
  },
  webhookUrl: {
    type: String,
    default: '',
  },
  // Widget customization
  widgetIcon: {
    type: String,
    default: null, // URL to custom widget icon
  },
  widgetIconType: {
    type: String,
    enum: ['default', 'custom', 'emoji'],
    default: 'default',
  },
  widgetIconEmoji: {
    type: String,
    default: '💬',
  },
  headerColor: {
    type: String,
    default: '#8b5cf6',
  },
  footerColor: {
    type: String,
    default: '#f8fafc',
  },
  bodyColor: {
    type: String,
    default: '#ffffff',
  },
  logo: {
    type: String,
    default: null,
  },
  widgetImages: [{
    type: String,
    default: [],
  }],
  // Voice settings
  voiceEnabled: {
    type: Boolean,
    default: false,
  },
  voiceSettings: {
    voice: {
      type: String,
      enum: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
      default: 'alloy',
    },
    speed: {
      type: Number,
      min: 0.25,
      max: 4.0,
      default: 1.0,
    },
    pitch: {
      type: Number,
      min: 0.25,
      max: 4.0,
      default: 1.0,
    },
    language: {
      type: String,
      default: 'en-US',
    },
  },
});

const BotMetricsSchema = new Schema({
  totalConversations: {
    type: Number,
    default: 0,
  },
  totalSessions: {
    type: Number,
    default: 0,
  },
  totalInteractions: {
    type: Number,
    default: 0,
  },
  uniqueUsers: {
    type: Number,
    default: 0,
  },
  activeUsers: {
    type: Number,
    default: 0,
  },
  newMessages24h: {
    type: Number,
    default: 0,
  },
  averageResponseTime: {
    type: Number,
    default: 0,
  },
  handoverRate: {
    type: Number,
    default: 0,
  },
  averageInteractionsPerUser: {
    type: Number,
    default: 0,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

const BotSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  avatar: {
    type: String,
    default: null,
  },
  companyLogo: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'draft',
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  settings: {
    type: BotSettingsSchema,
    default: () => ({}),
  },
  metrics: {
    type: BotMetricsSchema,
    default: () => ({}),
  },
}, {
  timestamps: true,
});

export default (mongoose.models?.Bot as mongoose.Model<any>) || model('Bot', BotSchema); 