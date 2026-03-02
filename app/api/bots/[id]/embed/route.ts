import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Bot from '@/models/Bot';

function getBaseUrl(request: NextRequest): string {
  try {
    const url = new URL(request.url);
    const host = url.host;
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      return `${url.protocol}//${host}`.replace(/\/$/, '');
    }
  } catch (_) {}
  return (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

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

    const baseUrl = getBaseUrl(request);
    const embedCode = generateEmbedCode(bot, baseUrl);
    
    return NextResponse.json({
      botId: bot._id,
      botName: bot.name,
      embedCode,
      widgetUrl: `${baseUrl}/widget.js`
    });
  } catch (error) {
    console.error('Error generating embed code:', error);
    return NextResponse.json(
      { error: 'Failed to generate embed code' },
      { status: 500 }
    );
  }
}

function generateEmbedCode(bot: any, baseUrlOverride?: string): string {
  const baseUrl = (baseUrlOverride || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
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
