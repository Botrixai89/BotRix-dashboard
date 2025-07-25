import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const envVars = {
      MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
      JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
      NODE_ENV: process.env.NODE_ENV || 'development',
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'Not set',
      SOCKET_PORT: process.env.SOCKET_PORT || 'Not set',
      NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'Not set',
      WEBHOOK_SECRET: process.env.WEBHOOK_SECRET ? 'Set' : 'Not set',
      ALLOWED_WEBHOOK_ORIGINS: process.env.ALLOWED_WEBHOOK_ORIGINS || 'Not set',
      UPLOAD_MAX_SIZE: process.env.UPLOAD_MAX_SIZE || 'Not set',
    }

    return NextResponse.json(envVars)
  } catch (error) {
    console.error('Error checking environment variables:', error)
    return NextResponse.json(
      { error: 'Failed to check environment variables' },
      { status: 500 }
    )
  }
} 