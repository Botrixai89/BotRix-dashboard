import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      mongodb: process.env.MONGODB_URI ? 'configured' : 'not configured',
      jwt: process.env.JWT_SECRET ? 'configured' : 'not configured',
    }

    return NextResponse.json(health)
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 500 }
    )
  }
} 