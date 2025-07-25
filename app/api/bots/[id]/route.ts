import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Bot from '@/models/Bot';
import Conversation from '@/models/Conversation';
import BotFlow from '@/models/BotFlow';
import TeamMember from '@/models/TeamMember';
import mongoose from 'mongoose';

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
      success: true,
      bot,
    });
  } catch (error) {
    console.error('Error fetching bot:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bot' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { settings, name, description, status } = body;

    const bot = await Bot.findById(params.id);
    if (!bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      );
    }

    // Update bot properties
    if (name !== undefined) bot.name = name;
    if (description !== undefined) bot.description = description;
    if (status !== undefined) bot.status = status;

    // Update bot settings
    if (settings) {
      if (settings.webhookUrl !== undefined) {
        bot.settings.webhookUrl = settings.webhookUrl;
      }
      if (settings.welcomeMessage !== undefined) {
        bot.settings.welcomeMessage = settings.welcomeMessage;
      }
      if (settings.fallbackMessage !== undefined) {
        bot.settings.fallbackMessage = settings.fallbackMessage;
      }
      if (settings.primaryColor !== undefined) {
        bot.settings.primaryColor = settings.primaryColor;
      }
      if (settings.collectUserInfo !== undefined) {
        bot.settings.collectUserInfo = settings.collectUserInfo;
      }
      if (settings.handoverEnabled !== undefined) {
        bot.settings.handoverEnabled = settings.handoverEnabled;
      }
    }

    await bot.save();

    return NextResponse.json({
      success: true,
      message: 'Bot updated successfully',
      bot,
    });
  } catch (error) {
    console.error('Error updating bot:', error);
    return NextResponse.json(
      { error: 'Failed to update bot' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    // First check if bot exists
    const bot = await Bot.findById(params.id);
    if (!bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      );
    }

    // Delete all related data in a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Delete conversations
      await Conversation.deleteMany({ botId: params.id }, { session });
      
      // Delete bot flows
      await BotFlow.deleteMany({ botId: params.id }, { session });
      
      // Delete team members
      await TeamMember.deleteMany({ botId: params.id }, { session });
      
      // Finally delete the bot
      await Bot.findByIdAndDelete(params.id, { session });

      await session.commitTransaction();
      
      return NextResponse.json({
        success: true,
        message: 'Bot and all associated data deleted successfully',
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Error deleting bot:', error);
    return NextResponse.json(
      { error: 'Failed to delete bot' },
      { status: 500 }
    );
  }
} 