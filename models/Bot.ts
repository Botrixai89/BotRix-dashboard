import mongoose, { Schema, model, models } from 'mongoose';

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
    default: 'https://automation.botrixai.com/webhook/8b0df4ab-cb69-48d7-b3f4-d8a68a420ef8/chat',
  },
});

const BotMetricsSchema = new Schema({
  totalConversations: {
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

export default models.Bot || model('Bot', BotSchema); 