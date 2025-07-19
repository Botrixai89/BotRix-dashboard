import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookies } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    )

    // Clear authentication cookies
    return clearAuthCookies(response)
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 