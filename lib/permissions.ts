import dbConnect from './mongodb';
import TeamMember from '@/models/TeamMember';
import Bot from '@/models/Bot';

export interface PermissionCheck {
  hasAccess: boolean;
  role?: string;
  permissions?: string[];
  error?: string;
}

export async function checkBotAccess(userId: string, botId: string): Promise<PermissionCheck> {
  try {
    await dbConnect();

    // First check if user owns the bot
    const bot = await Bot.findById(botId);
    if (!bot) {
      return { hasAccess: false, error: 'Bot not found' };
    }

    if (bot.userId.toString() === userId) {
      // Bot owner has all permissions
      return {
        hasAccess: true,
        role: 'owner',
        permissions: [
          'view_bot',
          'edit_bot',
          'delete_bot',
          'view_conversations',
          'reply_conversations',
          'assign_conversations',
          'view_analytics',
          'manage_team',
          'export_data'
        ]
      };
    }

    // Check team membership
    const teamMember = await TeamMember.findOne({
      botId,
      userId,
      status: 'active'
    }).populate('userId', 'name email');

    if (!teamMember) {
      return { hasAccess: false, error: 'Access denied' };
    }

    return {
      hasAccess: true,
      role: teamMember.role,
      permissions: teamMember.permissions
    };
  } catch (error) {
    console.error('Error checking bot access:', error);
    return { hasAccess: false, error: 'Internal server error' };
  }
}

export async function checkPermission(
  userId: string,
  botId: string,
  permission: string
): Promise<boolean> {
  const access = await checkBotAccess(userId, botId);
  
  if (!access.hasAccess) {
    return false;
  }

  // Bot owner has all permissions
  if (access.role === 'owner') {
    return true;
  }

  return access.permissions?.includes(permission) || false;
}

export async function getBotTeamMembers(botId: string): Promise<any[]> {
  try {
    await dbConnect();
    
    const teamMembers = await TeamMember.find({ botId })
      .populate('userId', 'name email avatar')
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 });

    return teamMembers;
  } catch (error) {
    console.error('Error getting bot team members:', error);
    return [];
  }
}

export async function inviteTeamMember(
  botId: string,
  email: string,
  role: string,
  invitedBy: string
): Promise<{ success: boolean; error?: string; teamMember?: any }> {
  try {
    await dbConnect();

    // Check if user exists
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return { success: false, error: 'User not found with this email' };
    }

    // Check if already a team member
    const existingMember = await TeamMember.findOne({
      botId,
      userId: user._id
    });

    if (existingMember) {
      return { success: false, error: 'User is already a team member' };
    }

    // Create team member
    const teamMember = new TeamMember({
      botId,
      userId: user._id,
      role,
      invitedBy,
      status: 'pending'
    });

    await teamMember.save();

    // Populate user info
    await teamMember.populate('userId', 'name email avatar');
    await teamMember.populate('invitedBy', 'name email');

    return { success: true, teamMember };
  } catch (error) {
    console.error('Error inviting team member:', error);
    return { success: false, error: 'Failed to invite team member' };
  }
}

export async function updateTeamMemberRole(
  botId: string,
  userId: string,
  newRole: string,
  updatedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await dbConnect();

    // Check if updater has permission
    const canManage = await checkPermission(updatedBy, botId, 'manage_team');
    if (!canManage) {
      return { success: false, error: 'Insufficient permissions' };
    }

    const teamMember = await TeamMember.findOneAndUpdate(
      { botId, userId },
      { role: newRole },
      { new: true }
    );

    if (!teamMember) {
      return { success: false, error: 'Team member not found' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating team member role:', error);
    return { success: false, error: 'Failed to update role' };
  }
}

export async function removeTeamMember(
  botId: string,
  userId: string,
  removedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await dbConnect();

    // Check if remover has permission
    const canManage = await checkPermission(removedBy, botId, 'manage_team');
    if (!canManage) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Don't allow removing the bot owner
    const bot = await Bot.findById(botId);
    if (bot && bot.userId.toString() === userId) {
      return { success: false, error: 'Cannot remove bot owner' };
    }

    await TeamMember.findOneAndDelete({ botId, userId });

    return { success: true };
  } catch (error) {
    console.error('Error removing team member:', error);
    return { success: false, error: 'Failed to remove team member' };
  }
}

export async function acceptTeamInvitation(
  botId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await dbConnect();

    const teamMember = await TeamMember.findOneAndUpdate(
      { botId, userId, status: 'pending' },
      { 
        status: 'active',
        acceptedAt: new Date()
      },
      { new: true }
    );

    if (!teamMember) {
      return { success: false, error: 'Invitation not found or already accepted' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error accepting team invitation:', error);
    return { success: false, error: 'Failed to accept invitation' };
  }
} 