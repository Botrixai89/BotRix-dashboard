import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IIntegration extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'google-analytics' | 'google-calendar' | 'google-sheets' | 'google-translate';
  name: string;
  description: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'error';
  config: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
    apiKey?: string;
    viewId?: string; // For Analytics
    calendarId?: string; // For Calendar
    spreadsheetId?: string; // For Sheets
    targetLanguage?: string; // For Translate
  };
  metadata: {
    lastSync?: Date;
    errorMessage?: string;
    connectedAt?: Date;
    disconnectedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  updateStatus(status: 'connected' | 'disconnected' | 'error', errorMessage?: string): Promise<IIntegration>;
  updateTokens(accessToken: string, refreshToken?: string, expiresIn?: number): Promise<IIntegration>;
}

// Interface for static methods
export interface IIntegrationModel extends Model<IIntegration> {
  getByUser(userId: string): Promise<IIntegration[]>;
  getByUserAndType(userId: string, type: string): Promise<IIntegration | null>;
  createOrUpdate(userId: string, type: string, data: Partial<IIntegration>): Promise<IIntegration>;
}

const IntegrationSchema = new Schema<IIntegration, IIntegrationModel>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['google-analytics', 'google-calendar', 'google-sheets', 'google-translate'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'error'],
    default: 'disconnected'
  },
  config: {
    accessToken: String,
    refreshToken: String,
    expiresAt: Date,
    apiKey: String,
    viewId: String,
    calendarId: {
      type: String,
      default: 'primary'
    },
    spreadsheetId: String,
    targetLanguage: {
      type: String,
      default: 'en'
    }
  },
  metadata: {
    lastSync: Date,
    errorMessage: String,
    connectedAt: Date,
    disconnectedAt: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
IntegrationSchema.index({ userId: 1, type: 1 }, { unique: true });

// Virtual for checking if token is expired
IntegrationSchema.virtual('isTokenExpired').get(function() {
  if (!this.config.expiresAt) return true;
  return new Date() > this.config.expiresAt;
});

// Method to update connection status
IntegrationSchema.methods.updateStatus = function(status: 'connected' | 'disconnected' | 'error', errorMessage?: string) {
  this.status = status;
  this.metadata.errorMessage = errorMessage;
  
  if (status === 'connected') {
    this.metadata.connectedAt = new Date();
    this.metadata.errorMessage = undefined;
  } else if (status === 'disconnected') {
    this.metadata.disconnectedAt = new Date();
  }
  
  return this.save();
};

// Method to update tokens
IntegrationSchema.methods.updateTokens = function(accessToken: string, refreshToken?: string, expiresIn?: number) {
  this.config.accessToken = accessToken;
  if (refreshToken) {
    this.config.refreshToken = refreshToken;
  }
  if (expiresIn) {
    this.config.expiresAt = new Date(Date.now() + expiresIn * 1000);
  }
  this.metadata.lastSync = new Date();
  return this.save();
};

// Static method to get integrations by user
IntegrationSchema.statics.getByUser = function(userId: string) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

// Static method to get integration by user and type
IntegrationSchema.statics.getByUserAndType = function(userId: string, type: string) {
  return this.findOne({ userId, type });
};

// Static method to create or update integration
IntegrationSchema.statics.createOrUpdate = function(userId: string, type: string, data: Partial<IIntegration>) {
  return this.findOneAndUpdate(
    { userId, type },
    { ...data, userId, type },
    { upsert: true, new: true }
  );
};

const Integration = (mongoose.models.Integration as IIntegrationModel) || mongoose.model<IIntegration, IIntegrationModel>('Integration', IntegrationSchema);

export default Integration;
