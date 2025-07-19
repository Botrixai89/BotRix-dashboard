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

    const isDemoWebhook = bot.settings.webhookUrl === 'https://automation.botrixai.com/webhook/8b0df4ab-cb69-48d7-b3f4-d8a68a420ef8/chat';
    const hasPlaceholder = bot.settings.webhookUrl.includes('placeholder');
    const isEmpty = !bot.settings.webhookUrl || bot.settings.webhookUrl.trim() === '';
    
    return NextResponse.json({
      botId: bot._id,
      botName: bot.name,
      webhookUrl: bot.settings.webhookUrl,
      isDemoWebhook,
      hasPlaceholder,
      isEmpty,
      fallbackMessage: bot.settings.fallbackMessage,
      status: bot.status,
      debug: {
        webhookUrlLength: bot.settings.webhookUrl?.length || 0,
        webhookUrlType: typeof bot.settings.webhookUrl,
        isExactDemoMatch: bot.settings.webhookUrl === 'https://automation.botrixai.com/webhook/8b0df4ab-cb69-48d7-b3f4-d8a68a420ef8/chat',
        demoUrl: 'https://automation.botrixai.com/webhook/8b0df4ab-cb69-48d7-b3f4-d8a68a420ef8/chat'
      },
      recommendations: [
        isDemoWebhook ? 
          '⚠️  Your bot is using the demo webhook URL. Please update it with your real webhook URL.' : 
          '✅ Webhook URL looks configured',
        hasPlaceholder ? 
          '⚠️  Webhook URL contains placeholder text. Please update it with your real webhook URL.' : 
          '✅ Webhook URL does not contain placeholder',
        isEmpty ? 
          '⚠️  Webhook URL is empty. Please configure your webhook URL.' : 
          '✅ Webhook URL is not empty',
        bot.status === 'active' ? 
          '✅ Bot is active' : 
          '⚠️  Set bot status to active for production use'
      ]
    });

  } catch (error) {
    console.error('Error checking bot webhook:', error);
    return NextResponse.json(
      { error: 'Failed to check bot webhook configuration' },
      { status: 500 }
    );
  }
} 