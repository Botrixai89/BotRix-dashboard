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

    return NextResponse.json({
      bot: {
        id: bot._id,
        name: bot.name,
        status: bot.status,
        settings: bot.settings,
        createdAt: bot.createdAt,
        updatedAt: bot.updatedAt
      },
      webhookConfigured: !!bot.settings.webhookUrl,
      webhookUrl: bot.settings.webhookUrl
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bot configuration' },
      { status: 500 }
    );
  }
} 