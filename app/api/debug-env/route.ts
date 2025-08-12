import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    
    const envInfo = {
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      host,
      protocol,
      constructedBaseUrl: `${protocol}://${host}`,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
    };
    
    return NextResponse.json({
      success: true,
      environment: envInfo,
      message: 'Environment variables debug info'
    });
  } catch (error) {
    console.error('Debug env error:', error);
    return NextResponse.json(
      { error: 'Debug failed' },
      { status: 500 }
    );
  }
}
