import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Bot from '@/models/Bot'
import TeamMember from '@/models/TeamMember'
import User from '@/models/User'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
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
    const currentUser = await User.findOne({ email: session.user.email })
    if (!currentUser) {
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

    // Check if user owns the bot or is a team member with manage_team permission
    if (bot.userId.toString() !== currentUser._id.toString()) {
      const teamMember = await TeamMember.findOne({
        botId: params.id,
        userId: currentUser._id,
        status: 'active'
      })

      if (!teamMember || !teamMember.permissions.includes('manage_team')) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Get the team member to remove
    const teamMemberToRemove = await TeamMember.findById(params.memberId)
    if (!teamMemberToRemove) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    // Check if the team member belongs to this bot
    if (teamMemberToRemove.botId.toString() !== params.id) {
      return NextResponse.json(
        { error: 'Team member not found for this bot' },
        { status: 404 }
      )
    }

    // Prevent removing the bot owner
    if (teamMemberToRemove.userId.toString() === bot.userId.toString()) {
      return NextResponse.json(
        { error: 'Cannot remove the bot owner from the team' },
        { status: 400 }
      )
    }

    // Remove the team member
    await TeamMember.findByIdAndDelete(params.memberId)

    return NextResponse.json({
      message: 'Team member removed successfully'
    })

  } catch (error) {
    console.error('Team member removal error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
