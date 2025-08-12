import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing authentication...')
    
    // Log all cookies for debugging
    const allCookies = request.cookies.getAll()
    console.log('🍪 All cookies:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value })))
    
    // Check for NextAuth tokens specifically
    const nextAuthToken = request.cookies.get('next-auth.session-token')?.value || 
                         request.cookies.get('__Secure-next-auth.session-token')?.value;
    
    console.log('🎫 NextAuth token present:', !!nextAuthToken)
    
    if (nextAuthToken) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(nextAuthToken);
        console.log('🔍 Decoded NextAuth token:', {
          hasPayload: !!decoded,
          keys: decoded ? Object.keys(decoded) : [],
          email: decoded?.email,
          sub: decoded?.sub
        })
      } catch (error) {
        console.log('❌ Failed to decode NextAuth token:', error)
      }
    }
    
    // Try to get current user
    const user = await getCurrentUser(request)
    
    return NextResponse.json({
      success: true,
      hasUser: !!user,
      user: user ? {
        id: user._id,
        email: user.email,
        name: user.name
      } : null,
      cookies: allCookies.map(c => c.name),
      hasNextAuthToken: !!nextAuthToken
    })
  } catch (error) {
    console.error('❌ Test endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
