import { NextRequest, NextResponse } from 'next/server';
import { getNextAuthUser } from '@/lib/nextauth-helper';

export async function GET(request: NextRequest) {
  try {
    const user = await getNextAuthUser(request);
    
    if (user) {
      return NextResponse.json({
        success: true,
        message: 'Authentication successful',
        user: {
          id: user._id,
          email: user.email,
          name: user.name
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
