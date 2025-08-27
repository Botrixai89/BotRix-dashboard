import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Bot from '@/models/Bot'
import TeamMember from '@/models/TeamMember'
import User from '@/models/User'
import { sendEmail } from '@/lib/email-service'

export async function POST(
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

    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
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

    // Find the user to invite
    const invitedUser = await User.findOne({ email: email.toLowerCase() })
    if (!invitedUser) {
      return NextResponse.json(
        { error: 'User not found with this email address' },
        { status: 404 }
      )
    }

    // Check if user is already a team member
    const existingMember = await TeamMember.findOne({
      botId: params.id,
      userId: invitedUser._id
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a team member' },
        { status: 400 }
      )
    }

    // Create team member invitation
    const teamMember = new TeamMember({
      botId: params.id,
      userId: invitedUser._id,
      role,
      invitedBy: currentUser._id,
      status: 'pending'
    })

    await teamMember.save()

    // Send invitation email
    try {
      const inviteUrl = `${process.env.NEXTAUTH_URL}/dashboard/team/accept?token=${teamMember._id}`
      await sendEmail(
        invitedUser.email,
        `You've been invited to join ${bot.name} team`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Team Invitation</h2>
            <p>Hello ${invitedUser.name},</p>
            <p>You've been invited to join the team for <strong>${bot.name}</strong> as a <strong>${role}</strong>.</p>
            <p>Click the button below to accept the invitation:</p>
            <a href="${inviteUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Accept Invitation
            </a>
            <p>If you have any questions, please contact the team administrator.</p>
          </div>
        `
      )
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      message: 'Team member invited successfully',
      teamMember
    })

  } catch (error) {
    console.error('Team invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
