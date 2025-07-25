import { NextRequest, NextResponse } from 'next/server';

// Google Cloud Text-to-Speech API endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, settings, apiKey } = body;

    if (!text || !settings || !apiKey) {
      return NextResponse.json(
        { error: 'Text, settings, and API key are required' },
        { status: 400 }
      );
    }

    // Validate text length (Google Cloud TTS has limits)
    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Text too long. Maximum 5000 characters allowed.' },
        { status: 400 }
      );
    }

    // Map our voice types to Google Cloud voice names
    const voiceMap: Record<string, string> = {
      'alloy': 'en-US-Neural2-A',
      'echo': 'en-US-Neural2-C',
      'fable': 'en-US-Neural2-D',
      'onyx': 'en-US-Neural2-E',
      'nova': 'en-US-Neural2-F',
      'shimmer': 'en-US-Neural2-G'
    };

    const googleVoice = voiceMap[settings.voice] || 'en-US-Neural2-A';

    // Prepare request for Google Cloud Text-to-Speech API
    const ttsRequest = {
      input: { text },
      voice: {
        languageCode: settings.language || 'en-US',
        name: googleVoice,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: Math.max(0.25, Math.min(4.0, settings.speed || 1.0)),
        pitch: Math.max(-20.0, Math.min(20.0, settings.pitch || 0.0)),
        effectsProfileId: ['headphone-class-device'],
      },
    };

    console.log('🎤 Google Cloud TTS Request:', {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      voice: googleVoice,
      language: settings.language,
      speed: settings.speed,
      pitch: settings.pitch
    });

    // Call Google Cloud Text-to-Speech API
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ttsRequest),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Google Cloud TTS Error:', response.status, errorData);
      
      return NextResponse.json(
        { 
          error: 'Text-to-Speech failed',
          details: errorData,
          status: response.status
        },
        { status: response.status }
      );
    }

    const audioData = await response.json();
    
    if (!audioData.audioContent) {
      return NextResponse.json(
        { error: 'No audio content received from Google Cloud' },
        { status: 500 }
      );
    }

    // Convert base64 audio content to blob
    const audioBuffer = Buffer.from(audioData.audioContent, 'base64');
    
    console.log('✅ Google Cloud TTS Success:', {
      audioSize: audioBuffer.length,
      voice: googleVoice
    });

    // Return audio as MP3 blob
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('💥 Text-to-Speech API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
} 