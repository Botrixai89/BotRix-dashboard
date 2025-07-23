import mongoose, { Schema, model } from 'mongoose';

const MessageSchema = new Schema({
  content: {
    type: String,
    required: true,
  },
  sender: {
    type: String,
    enum: ['bot', 'user', 'agent'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'button'],
    default: 'text',
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: null,
  },
});

const ConversationSchema = new Schema({
  botId: {
    type: Schema.Types.ObjectId,
    ref: 'Bot',
    required: true,
  },
  userId: {
    type: String,
    default: null,
  },
  userInfo: {
    name: { type: String, default: null },
    email: { type: String, default: null },
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },
  },
  messages: [MessageSchema],
  status: {
    type: String,
    enum: ['new', 'active', 'closed', 'unassigned'],
    default: 'new',
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  tags: [{
    type: String,
  }],
}, {
  timestamps: true,
});

export default (mongoose.models?.Conversation as mongoose.Model<any>) || model('Conversation', ConversationSchema); 