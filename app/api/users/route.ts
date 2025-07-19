import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function GET() {
  try {
    await dbConnect()
    
    // Get all users (excluding passwords)
    const users = await User.find({}).select('-password').sort({ createdAt: -1 })
    
    return NextResponse.json(
      {
        users,
        count: users.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 