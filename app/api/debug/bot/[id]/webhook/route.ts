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

    return NextResponse.json({
      botId: bot._id,
      botName: bot.name,
      currentWebhookUrl: bot.settings.webhookUrl,
      webhookConfigured: !!bot.settings.webhookUrl,
      settings: {
        welcomeMessage: bot.settings.welcomeMessage,
        fallbackMessage: bot.settings.fallbackMessage,
        primaryColor: bot.settings.primaryColor,
      },
      status: bot.status,
      createdAt: bot.createdAt,
      updatedAt: bot.updatedAt,
      message: bot.settings.webhookUrl ? 
        '✅ Webhook URL is configured' : 
        '⚠️  No webhook URL configured for this bot'
    });

  } catch (error) {
    console.error('Error checking bot webhook:', error);
    return NextResponse.json(
      { error: 'Failed to check bot webhook configuration' },
      { status: 500 }
    );
  }
} 