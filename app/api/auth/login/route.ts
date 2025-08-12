import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { comparePassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if account is locked
    if (user.isLocked) {
      return NextResponse.json(
        { error: 'Account is temporarily locked due to too many failed login attempts. Please try again later.' },
        { status: 423 }
      )
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password)

    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts()
      
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts()

    // Generate JWT token
    const token = generateToken({ 
      _id: user._id.toString(), 
      email: user.email, 
      name: user.name 
    })

    // Create response with user data (excluding password)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      logo: user.logo,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    }

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
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
    console.error('Login error:', error)
    
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