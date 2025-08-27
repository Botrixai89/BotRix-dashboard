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

    // Send password reset email (with error handling)
    try {
      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${passwordResetToken}`
      
      // Import and use the email service
      const { sendPasswordResetEmail } = await import('@/lib/email-service')
      await sendPasswordResetEmail(user.email, user.name, resetUrl)
      
      console.log('Password reset email sent successfully')
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      // Don't fail the request if email fails, just log it
      // In production, you might want to queue the email for retry
    }

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

    // Handle validation errors
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid data provided. Please check your email format.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
} 