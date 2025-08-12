import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { validateEmail, generatePasswordResetToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Connect to database
    await dbConnect()

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { message: 'If an account with that email exists, a password reset link has been sent.' },
        { status: 200 }
      )
    }

    // Generate password reset token
    const passwordResetToken = generatePasswordResetToken()
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save reset token to user
    user.passwordResetToken = passwordResetToken
    user.passwordResetExpires = passwordResetExpires
    await user.save()

    // Send password reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${passwordResetToken}`
    
    // Import and use the email service
    const { sendPasswordResetEmail } = await import('@/lib/email-service')
    await sendPasswordResetEmail(user.email, user.name, resetUrl)

    return NextResponse.json(
      { 
        message: 'Password reset link sent to your email'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Forgot password error:', error)
    
    // Handle MongoDB connection errors
    if (error instanceof Error && error.message.includes('MongoDB')) {
      return NextResponse.json(
        { error: 'Database connection failed. Please try again later.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 