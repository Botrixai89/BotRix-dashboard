import mongoose, { Schema, model } from 'mongoose';

const BotSettingsSchema = new Schema({
  welcomeMessage: {
    type: String,
    default: 'Hello! How can I help you today?',
  },
  primaryColor: {
    type: String,
    default: '#8b5cf6',
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
  // Rule-based bot configuration
  botType: {
    type: String,
    enum: ['webhook', 'rule-based', 'hybrid'],
    default: 'webhook',
  },
  ruleBasedConfig: {
    enabled: {
      type: Boolean,
      default: false,
    },
    rules: [{
      id: String,
      name: String,
      conditions: [{
        field: String, // 'message', 'user_input', 'variable'
        operator: {
          type: String,
          enum: ['contains', 'equals', 'starts_with', 'ends_with', 'regex', 'greater_than', 'less_than', 'in_list']
        },
        value: Schema.Types.Mixed,
        caseSensitive: {
          type: Boolean,
          default: false,
        }
      }],
      actions: [{
        type: {
          type: String,
          enum: ['send_message', 'send_image', 'set_variable', 'call_webhook', 'redirect', 'pause']
        },
        data: Schema.Types.Mixed,
        order: Number
      }],
      priority: {
        type: Number,
        default: 1,
      },
      isActive: {
        type: Boolean,
        default: true,
      }
    }],
    variables: [{
      name: String,
      type: {
        type: String,
        enum: ['string', 'number', 'boolean', 'array', 'object']
      },
      defaultValue: Schema.Types.Mixed,
      description: String
    }]
  },
  // Enhanced webhook configuration
  webhookConfig: {
    primary: {
      url: String,
      method: {
        type: String,
        enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        default: 'POST'
      },
      headers: Schema.Types.Mixed,
      timeout: {
        type: Number,
        default: 30,
        min: 1,
        max: 300
      },
      retryAttempts: {
        type: Number,
        default: 2,
        min: 0,
        max: 5
      },
      isActive: {
        type: Boolean,
        default: true
      }
    },
    fallback: {
      url: String,
      method: {
        type: String,
        enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        default: 'POST'
      },
      headers: Schema.Types.Mixed,
      timeout: {
        type: Number,
        default: 30,
        min: 1,
        max: 300
      },
      retryAttempts: {
        type: Number,
        default: 1,
        min: 0,
        max: 3
      },
      isActive: {
        type: Boolean,
        default: false
      }
    },
    customWebhooks: [{
      id: String,
      name: String,
      url: String,
      method: {
        type: String,
        enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        default: 'POST'
      },
      headers: Schema.Types.Mixed,
      timeout: {
        type: Number,
        default: 30,
        min: 1,
        max: 300
      },
      retryAttempts: {
        type: Number,
        default: 1,
        min: 0,
        max: 3
      },
      triggerConditions: [{
        field: String,
        operator: {
          type: String,
          enum: ['contains', 'equals', 'starts_with', 'ends_with', 'regex']
        },
        value: Schema.Types.Mixed
      }],
      isActive: {
        type: Boolean,
        default: true
      }
    }]
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
  theme: {
    type: String,
    enum: ['modern', 'minimal', 'gradient'],
    default: 'modern',
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