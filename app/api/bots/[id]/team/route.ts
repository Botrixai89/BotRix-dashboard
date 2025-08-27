import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Bot from '@/models/Bot'
import TeamMember from '@/models/TeamMember'
import User from '@/models/User'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await dbConnect()

    // Get the current user
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get the bot
    const bot = await Bot.findById(params.id)
    if (!bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      )
    }

    // Check if user owns the bot or is a team member
    if (bot.userId.toString() !== user._id.toString()) {
      // Check if user is a team member with manage_team permission
      const teamMember = await TeamMember.findOne({
        botId: params.id,
        userId: user._id,
        status: 'active'
      })

      if (!teamMember || !teamMember.permissions.includes('manage_team')) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Get all team members for this bot
    const teamMembers = await TeamMember.find({ botId: params.id })
      .populate('userId', 'name email')
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 })

    return NextResponse.json({
      members: teamMembers
    })

  } catch (error) {
    console.error('Team members fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
