import mongoose, { Schema, model } from 'mongoose';

const TeamMemberSchema = new Schema({
  botId: {
    type: Schema.Types.ObjectId,
    ref: 'Bot',
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'agent', 'viewer'],
    default: 'agent',
  },
  permissions: [{
    type: String,
    enum: [
      'view_bot',
      'edit_bot',
      'delete_bot',
      'view_conversations',
      'reply_conversations',
      'assign_conversations',
      'view_analytics',
      'manage_team',
      'export_data'
    ],
  }],
  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'inactive'],
    default: 'pending',
  },
  invitedAt: {
    type: Date,
    default: Date.now,
  },
  acceptedAt: {
    type: Date,
    default: null,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound index to ensure unique bot-user combinations
TeamMemberSchema.index({ botId: 1, userId: 1 }, { unique: true });

// Define permission types
type Permission = 'view_bot' | 'edit_bot' | 'delete_bot' | 'view_conversations' | 'reply_conversations' | 'assign_conversations' | 'view_analytics' | 'manage_team' | 'export_data';

// Define the getDefaultPermissions function
const getDefaultPermissions = function(role: string): Permission[] {
  const permissionMap: Record<string, Permission[]> = {
    admin: [
      'view_bot',
      'edit_bot',
      'delete_bot',
      'view_conversations',
      'reply_conversations',
      'assign_conversations',
      'view_analytics',
      'manage_team',
      'export_data'
    ],
    editor: [
      'view_bot',
      'edit_bot',
      'view_conversations',
      'reply_conversations',
      'assign_conversations',
      'view_analytics',
      'export_data'
    ],
    agent: [
      'view_bot',
      'view_conversations',
      'reply_conversations',
      'assign_conversations',
      'view_analytics'
    ],
    viewer: [
      'view_bot',
      'view_conversations',
      'view_analytics'
    ]
  };

  return permissionMap[role] || permissionMap.viewer;
};

// Pre-save middleware to set default permissions based on role
TeamMemberSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    this.permissions = getDefaultPermissions(this.role);
  }
  next();
});

// Add the method to the schema
TeamMemberSchema.methods.getDefaultPermissions = getDefaultPermissions;

TeamMemberSchema.methods.hasPermission = function(permission: string): boolean {
  return this.permissions.includes(permission);
};

TeamMemberSchema.methods.canViewBot = function(): boolean {
  return this.hasPermission('view_bot');
};

TeamMemberSchema.methods.canEditBot = function(): boolean {
  return this.hasPermission('edit_bot');
};

TeamMemberSchema.methods.canDeleteBot = function(): boolean {
  return this.hasPermission('delete_bot');
};

TeamMemberSchema.methods.canViewConversations = function(): boolean {
  return this.hasPermission('view_conversations');
};

TeamMemberSchema.methods.canReplyConversations = function(): boolean {
  return this.hasPermission('reply_conversations');
};

TeamMemberSchema.methods.canAssignConversations = function(): boolean {
  return this.hasPermission('assign_conversations');
};

TeamMemberSchema.methods.canViewAnalytics = function(): boolean {
  return this.hasPermission('view_analytics');
};

TeamMemberSchema.methods.canManageTeam = function(): boolean {
  return this.hasPermission('manage_team');
};

TeamMemberSchema.methods.canExportData = function(): boolean {
  return this.hasPermission('export_data');
};

export default (mongoose.models?.TeamMember as mongoose.Model<any>) || model('TeamMember', TeamMemberSchema); 