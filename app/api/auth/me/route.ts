import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = getTokenFromCookies(request)
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify token
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Connect to database
    await dbConnect()

    // Get user from database
    const user = await User.findById(payload.userId).select('-password')
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        logo: user.logo,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      }
    })
  } catch (error) {
    console.error('Auth check error:', error)
    
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

export async function PUT(request: NextRequest) {
  try {
    // Get token from cookies
    const token = getTokenFromCookies(request)
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify token
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Connect to database
    await dbConnect()

    // Get request body
    const body = await request.json()
    const { name, email, logo } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email: email, 
      _id: { $ne: payload.userId } 
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is already taken by another user' },
        { status: 400 }
      )
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      payload.userId,
      {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        logo: logo || null,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password')

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        logo: updatedUser.logo,
        isEmailVerified: updatedUser.isEmailVerified,
        createdAt: updatedUser.createdAt,
        lastLogin: updatedUser.lastLogin,
      }
    })
  } catch (error) {
    console.error('Profile update error:', error)
    
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