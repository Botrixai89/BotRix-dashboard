import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { hashPassword, generateToken, validateEmail } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
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

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Connect to database
    await dbConnect()

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create new user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    })

    await newUser.save()

    // Send welcome email (optional - won't break if email service fails)
    try {
      const { sendWelcomeEmail } = await import('@/lib/email-service')
      await sendWelcomeEmail(newUser.email, newUser.name)
    } catch (emailError) {
      console.warn('Failed to send welcome email:', emailError)
      // Don't fail the signup process if email fails
    }

    // Generate JWT token
    const token = generateToken({ 
      _id: newUser._id.toString(), 
      email: newUser.email, 
      name: newUser.name 
    })

    // Create response with user data (excluding password)
    const userResponse = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      avatar: newUser.avatar,
      logo: newUser.logo,
      createdAt: newUser.createdAt,
      lastLogin: newUser.lastLogin,
    }

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: userResponse
    })

    // Set JWT token as HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Signup error:', error)
    
    // Handle MongoDB connection errors
    if (error instanceof Error && error.message.includes('MongoDB')) {
      return NextResponse.json(
        { error: 'Database connection failed. Please try again later.' },
        { status: 503 }
      )
    }
    
    // Handle duplicate key errors
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 