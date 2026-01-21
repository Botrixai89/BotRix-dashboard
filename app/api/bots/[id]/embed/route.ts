import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Bot from '@/models/Bot';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const bot = await Bot.findById(params.id);
    if (!bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      );
    }

    // Generate embed code
    const embedCode = generateEmbedCode(bot);
    
    return NextResponse.json({
      botId: bot._id,
      botName: bot.name,
      embedCode,
      widgetUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/widget.js`
    });
  } catch (error) {
    console.error('Error generating embed code:', error);
    return NextResponse.json(
      { error: 'Failed to generate embed code' },
      { status: 500 }
    );
  }
}

function generateEmbedCode(bot: any): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const botId = bot._id;
  
  // Get bot settings
  const primaryColor = bot.settings?.primaryColor || '#8b5cf6';
  const secondaryColor = bot.settings?.secondaryColor || '#ec4899';
  const position = bot.settings?.position || 'bottom-right';
  const welcomeMessage = bot.settings?.welcomeMessage || 'Hello! How can I help you today?';
  const enableVoice = bot.settings?.enableVoice !== false;
  const theme = bot.settings?.theme || 'modern';
  
  // Generate the embed script
  const embedCode = `<!-- Botrix Chat Widget -->
<script 
  src="${baseUrl}/widget.js"
  data-botrix-bot-id="${botId}"
  data-botrix-primary-color="${primaryColor}"
  data-botrix-secondary-color="${secondaryColor}"
  data-botrix-position="${position}"
  data-botrix-welcome-message="${welcomeMessage}"
  data-botrix-enable-voice="${enableVoice}"
  data-botrix-theme="${theme}"
  data-botrix-demo-mode="false"
></script>`;

  return embedCode;
}
