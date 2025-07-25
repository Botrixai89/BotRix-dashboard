import { NextRequest, NextResponse } from 'next/server';

// Google Cloud Text-to-Speech Voices API endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('apiKey') || request.headers.get('authorization')?.replace('Bearer ', '');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    console.log('🎤 Fetching Google Cloud TTS voices...');

    // Call Google Cloud Text-to-Speech API to get available voices
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/voices?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Google Cloud Voices Error:', response.status, errorData);
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch voices',
          details: errorData,
          status: response.status
        },
        { status: response.status }
      );
    }

    const voicesData = await response.json();
    
    if (!voicesData.voices) {
      return NextResponse.json(
        { error: 'No voices data received from Google Cloud' },
        { status: 500 }
      );
    }

    // Filter and format voices for our use case
    const filteredVoices = voicesData.voices
      .filter((voice: any) => {
        // Filter for English voices with Neural2 models (high quality)
        return voice.languageCodes.includes('en-US') && 
               voice.name.includes('Neural2');
      })
      .map((voice: any) => ({
        name: voice.name,
        languageCode: voice.languageCodes[0],
        ssmlGender: voice.ssmlGender,
        naturalSampleRateHertz: voice.naturalSampleRateHertz,
        // Map to our voice types
        voiceType: getVoiceType(voice.name),
      }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    console.log('✅ Google Cloud Voices Success:', {
      totalVoices: voicesData.voices.length,
      filteredVoices: filteredVoices.length
    });

    return NextResponse.json({
      voices: filteredVoices,
      total: filteredVoices.length,
      language: 'en-US',
    });

  } catch (error) {
    console.error('💥 Voices API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to map Google Cloud voice names to our voice types
function getVoiceType(voiceName: string): string {
  const voiceMap: Record<string, string> = {
    'en-US-Neural2-A': 'alloy',
    'en-US-Neural2-C': 'echo',
    'en-US-Neural2-D': 'fable',
    'en-US-Neural2-E': 'onyx',
    'en-US-Neural2-F': 'nova',
    'en-US-Neural2-G': 'shimmer',
  };
  
  return voiceMap[voiceName] || 'alloy';
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