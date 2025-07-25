import { NextRequest, NextResponse } from 'next/server';

// Google Cloud Speech-to-Text API endpoint
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const apiKey = formData.get('apiKey') as string;

    if (!audioFile || !apiKey) {
      return NextResponse.json(
        { error: 'Audio file and API key are required' },
        { status: 400 }
      );
    }

    // Validate file size (Google Cloud STT has limits)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'Audio file too large. Maximum 10MB allowed.' },
        { status: 400 }
      );
    }

    // Detect encoding and sample rate
    let encoding = 'WEBM_OPUS';
    let sampleRateHertz = 48000;
    if (
      audioFile.type === 'audio/wav' ||
      audioFile.name.endsWith('.wav') ||
      audioFile.type === 'audio/x-wav'
    ) {
      encoding = 'LINEAR16';
      sampleRateHertz = 16000; // 16kHz is common for LINEAR16, but may vary
    }

    // Convert audio file to base64
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const audioBase64 = audioBuffer.toString('base64');

    console.log('🎙️ Google Cloud STT Request:', {
      fileName: audioFile.name,
      fileSize: audioFile.size,
      contentType: audioFile.type,
      encoding,
      sampleRateHertz
    });

    // Prepare request for Google Cloud Speech-to-Text API
    const sttRequest = {
      config: {
        encoding,
        sampleRateHertz,
        languageCode: 'en-US',
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: false,
        enableWordConfidence: true,
        model: 'latest_long', // Better for longer audio
        useEnhanced: true, // Use enhanced models for better accuracy
      },
      audio: {
        content: audioBase64,
      },
    };

    // Call Google Cloud Speech-to-Text API
    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sttRequest),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Google Cloud STT Error:', response.status, errorData);
      
      return NextResponse.json(
        { 
          error: 'Speech-to-Text failed',
          details: errorData,
          status: response.status
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    if (!result.results || result.results.length === 0) {
      return NextResponse.json(
        { 
          transcript: '',
          confidence: 0,
          error: 'No speech detected in audio'
        },
        { status: 200 }
      );
    }

    // Extract transcript and confidence from the best result
    const bestResult = result.results[0];
    const transcript = bestResult.alternatives[0]?.transcript || '';
    const confidence = bestResult.alternatives[0]?.confidence || 0;

    console.log('✅ Google Cloud STT Success:', {
      transcript: transcript.substring(0, 100) + (transcript.length > 100 ? '...' : ''),
      confidence: confidence.toFixed(3),
      isFinal: bestResult.isFinal
    });

    return NextResponse.json({
      transcript,
      confidence,
      isFinal: bestResult.isFinal || true,
      languageCode: bestResult.languageCode || 'en-US',
    });

  } catch (error) {
    console.error('💥 Speech-to-Text API Error:', error);
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