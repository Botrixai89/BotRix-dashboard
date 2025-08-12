import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        mongodbUri: process.env.MONGODB_URI ? 'Set' : 'Not set'
      },
      cookies: {
        hasNextAuthSessionToken: !!request.cookies.get('next-auth.session-token'),
        hasSecureNextAuthSessionToken: !!request.cookies.get('__Secure-next-auth.session-token'),
        hasNextAuthCsrfToken: !!request.cookies.get('next-auth.csrf-token'),
        hasSecureNextAuthCsrfToken: !!request.cookies.get('__Host-next-auth.csrf-token'),
        hasCustomAuthToken: !!request.cookies.get('token'),
        allCookies: Object.fromEntries(request.cookies.getAll().map(c => [c.name, 'Present']))
      },
      headers: {
        userAgent: request.headers.get('user-agent'),
        host: request.headers.get('host'),
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer')
      }
    }

    // Test database connection
    try {
      await dbConnect()
      debugInfo.database = {
        status: 'Connected',
        message: 'Database connection successful'
      }
      
      // Count users
      const userCount = await User.countDocuments()
      debugInfo.database.userCount = userCount
      
      // Check for users with Google IDs
      const googleUsers = await User.countDocuments({ googleId: { $exists: true, $ne: null } })
      debugInfo.database.googleUsers = googleUsers
      
    } catch (dbError) {
      debugInfo.database = {
        status: 'Error',
        message: dbError instanceof Error ? dbError.message : 'Unknown database error',
        error: dbError
      }
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        timestamp: new Date().toISOString(),
        error: error
      }
    }, { status: 500 })
  }
}
