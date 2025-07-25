import { NextRequest, NextResponse } from 'next/server';

// Check Google Cloud Voice Support API endpoint
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        supported: false,
        reason: 'Google Cloud API key not configured',
        fallback: 'browser',
      });
    }

    // Test the API key by making a simple request to the voices endpoint
    try {
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/voices?key=${apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        return NextResponse.json({
          supported: true,
          apiKey: apiKey.substring(0, 10) + '...', // Only show first 10 chars for security
          services: ['text-to-speech', 'speech-to-text'],
          fallback: 'google-cloud',
        });
      } else {
        return NextResponse.json({
          supported: false,
          reason: 'Invalid Google Cloud API key',
          fallback: 'browser',
        });
      }
    } catch (error) {
      return NextResponse.json({
        supported: false,
        reason: 'Google Cloud API not accessible',
        fallback: 'browser',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

  } catch (error) {
    console.error('💥 Voice Support Check Error:', error);
    return NextResponse.json(
      { 
        supported: false,
        reason: 'Internal server error',
        fallback: 'browser',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle preflight OPTIONS requests
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
} 