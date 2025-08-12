import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookies } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json(
      { message: 'Signed out successfully' },
      { status: 200 }
    )

    // Clear custom auth cookies
    let clearedResponse = clearAuthCookies(response)
    
    // Clear NextAuth session cookies
    clearedResponse.cookies.set('next-auth.session-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })
    
    clearedResponse.cookies.set('__Secure-next-auth.session-token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })
    
    // Clear CSRF token
    clearedResponse.cookies.set('next-auth.csrf-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })
    
    clearedResponse.cookies.set('__Host-next-auth.csrf-token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })
    
    // Clear callback URL
    clearedResponse.cookies.set('next-auth.callback-url', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })
    
    clearedResponse.cookies.set('__Secure-next-auth.callback-url', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return clearedResponse
  } catch (error) {
    console.error('Signout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
