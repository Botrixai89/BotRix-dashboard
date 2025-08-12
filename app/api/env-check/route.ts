import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      MONGODB_URI: !!process.env.MONGODB_URI,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV,
    };
    
    return NextResponse.json({
      success: true,
      environment: envCheck,
      message: 'Environment variables check completed'
    });
  } catch (error) {
    console.error('Environment check error:', error);
    return NextResponse.json(
      { error: 'Environment check failed' },
      { status: 500 }
    );
  }
}
