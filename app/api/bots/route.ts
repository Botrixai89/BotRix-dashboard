import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Bot from '@/models/Bot';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const body = await request.json();
    const { name, description, welcomeMessage, primaryColor, webhookUrl } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Validate webhook URL format
    if (webhookUrl && !isValidUrl(webhookUrl)) {
      return NextResponse.json(
        { error: 'Invalid webhook URL format' },
        { status: 400 }
      );
    }

    const newBot = new Bot({
      name,
      description: description || '',
      userId: authResult.user._id,
      settings: {
        welcomeMessage: welcomeMessage || 'Hello! How can I help you today?',
        primaryColor: primaryColor || '#2563eb',
        webhookUrl: webhookUrl || 'https://automation.botrixai.com/webhook/8b0df4ab-cb69-48d7-b3f4-d8a68a420ef8/chat',
        fallbackMessage: "I'm sorry, I didn't understand that. Can you please rephrase?",
        collectUserInfo: false,
        handoverEnabled: true,
      },
      metrics: {
        totalConversations: 0,
        newMessages24h: 0,
        averageResponseTime: 0,
        handoverRate: 0,
      },
    });

    const savedBot = await newBot.save();
    
    return NextResponse.json({
      success: true,
      bot: savedBot,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating bot:', error);
    return NextResponse.json(
      { error: 'Failed to create bot' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const bots = await Bot.find({ userId: authResult.user._id }).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      bots,
    });

  } catch (error) {
    console.error('Error fetching bots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bots' },
      { status: 500 }
    );
  }
}

function isValidUrl(string: string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
} 