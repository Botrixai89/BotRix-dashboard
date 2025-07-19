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
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Check if using demo webhook
    const isDemoWebhook = bot.settings.webhookUrl === 'https://automation.botrixai.com/webhook/8b0df4ab-cb69-48d7-b3f4-d8a68a420ef8/chat';
    
    return NextResponse.json({
      botId: bot._id,
      botName: bot.name,
      currentWebhookUrl: bot.settings.webhookUrl,
      isDemoWebhook: isDemoWebhook,
      webhookConfigured: bot.settings.webhookUrl && !isDemoWebhook,
      settings: {
        welcomeMessage: bot.settings.welcomeMessage,
        fallbackMessage: bot.settings.fallbackMessage,
        primaryColor: bot.settings.primaryColor,
      },
      status: bot.status,
      createdAt: bot.createdAt,
      updatedAt: bot.updatedAt
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bot configuration' },
      { status: 500 }
    );
  }
} 