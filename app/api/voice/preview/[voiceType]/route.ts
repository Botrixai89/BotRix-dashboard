import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { voiceType: string } }
) {
  try {
    const voiceType = params.voiceType;
    
    // This is a placeholder endpoint for voice preview
    // In a real implementation, you might return actual audio files
    // or use a TTS service to generate preview audio
    
    const previewText = "Hello! This is a preview of how your bot will sound with this voice setting.";
    
    return NextResponse.json({
      success: true,
      voiceType,
      previewText,
      message: `Voice preview for ${voiceType} voice type`
    });
    
  } catch (error) {
    console.error('Voice preview error:', error);
    return NextResponse.json(
      { error: 'Failed to generate voice preview' },
      { status: 500 }
    );
  }
} 