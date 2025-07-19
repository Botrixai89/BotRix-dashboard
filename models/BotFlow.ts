import mongoose, { Schema, model, models } from 'mongoose';

const FlowNodeSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['message', 'question', 'condition', 'action', 'handover', 'input', 'api_call'],
    required: true,
  },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  data: {
    title: { type: String, required: true },
    content: { type: String, required: true },
    options: [{ type: String }],
    variable: { type: String },
    apiUrl: { type: String },
    apiMethod: { type: String },
    apiHeaders: { type: Schema.Types.Mixed },
    conditions: [{
      field: { type: String },
      operator: { 
        type: String, 
        enum: ['equals', 'contains', 'starts_with', 'ends_with', 'greater_than', 'less_than'] 
      },
      value: { type: String },
    }],
    actions: [{
      type: { 
        type: String, 
        enum: ['set_variable', 'send_email', 'webhook', 'redirect'] 
      },
      data: { type: Schema.Types.Mixed },
    }],
  },
  style: {
    backgroundColor: { type: String },
    borderColor: { type: String },
    color: { type: String },
  },
});

const FlowConnectionSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    required: true,
  },
  target: {
    type: String,
    required: true,
  },
  sourceHandle: { type: String },
  targetHandle: { type: String },
  condition: { type: String },
  label: { type: String },
  style: {
    stroke: { type: String },
    strokeWidth: { type: Number },
  },
});

const VariableSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'array', 'object'],
    required: true,
  },
  defaultValue: { type: Schema.Types.Mixed },
  description: { type: String },
});

const BotFlowSchema = new Schema({
  botId: {
    type: Schema.Types.ObjectId,
    ref: 'Bot',
    required: true,
  },
  nodes: [FlowNodeSchema],
  connections: [FlowConnectionSchema],
  variables: [VariableSchema],
  isActive: {
    type: Boolean,
    default: false,
  },
  version: {
    type: Number,
    default: 1,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
BotFlowSchema.index({ botId: 1, version: -1 });
BotFlowSchema.index({ botId: 1, isActive: 1 });

export default models.BotFlow || model('BotFlow', BotFlowSchema); 