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
    
    // Check for critical missing variables
    const missingCritical = [];
    if (!process.env.MONGODB_URI) missingCritical.push('MONGODB_URI');
    if (!process.env.JWT_SECRET) missingCritical.push('JWT_SECRET');
    if (!process.env.NEXTAUTH_SECRET) missingCritical.push('NEXTAUTH_SECRET');
    if (!process.env.NEXTAUTH_URL) missingCritical.push('NEXTAUTH_URL');
    
    // Check for Google OAuth (optional but recommended)
    const missingGoogle = [];
    if (!process.env.GOOGLE_CLIENT_ID) missingGoogle.push('GOOGLE_CLIENT_ID');
    if (!process.env.GOOGLE_CLIENT_SECRET) missingGoogle.push('GOOGLE_CLIENT_SECRET');
    
    const status = missingCritical.length > 0 ? 'error' : 
                   missingGoogle.length > 0 ? 'warning' : 'success';
    
    return NextResponse.json({
      success: true,
      status,
      environment: envCheck,
      missingCritical,
      missingGoogle,
      message: missingCritical.length > 0 
        ? `Critical environment variables missing: ${missingCritical.join(', ')}`
        : missingGoogle.length > 0
        ? `Google OAuth not configured: ${missingGoogle.join(', ')}`
        : 'Environment configuration is complete'
    });
  } catch (error) {
    console.error('Environment check error:', error);
    return NextResponse.json(
      { error: 'Environment check failed' },
      { status: 500 }
    );
  }
}
