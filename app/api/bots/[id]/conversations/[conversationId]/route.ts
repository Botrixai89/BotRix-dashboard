import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';
import { Message } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; conversationId: string } }
) {
  try {
    console.log('🔍 Conversation API called with params:', params);
    
    const authResult = await requireAuth(request);
    if (authResult.error) {
      console.log('❌ Auth failed:', authResult.error);
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    console.log('✅ Auth successful, connecting to database...');
    await dbConnect();
    
    const { id: botId, conversationId } = params;
    console.log('🤖 Bot ID:', botId, 'Conversation ID:', conversationId);
    
    // Validate IDs format
    if (!botId || !mongoose.Types.ObjectId.isValid(botId)) {
      console.log('❌ Invalid bot ID format:', botId);
      return NextResponse.json(
        { error: 'Invalid bot ID format' },
        { status: 400 }
      );
    }

    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      console.log('❌ Invalid conversation ID format:', conversationId);
      return NextResponse.json(
        { error: 'Invalid conversation ID format' },
        { status: 400 }
      );
    }
    
    // Find the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      botId: botId
    }).populate('botId', 'name');

    if (!conversation) {
      console.log('❌ Conversation not found');
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this bot
    if (conversation.botId.userId.toString() !== authResult.user._id.toString()) {
      console.log('❌ User does not have access to this bot');
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    console.log('✅ Conversation found:', {
      id: conversation._id,
      userInfo: conversation.userInfo,
      messageCount: conversation.messages.length,
      status: conversation.status
    });

    return NextResponse.json({
      _id: conversation._id,
      status: conversation.status,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      userInfo: conversation.userInfo,
      botInfo: {
        _id: conversation.botId._id,
        name: conversation.botId.name
      },
      messages: conversation.messages.map((msg: Message) => ({
        _id: msg._id,
        content: msg.content,
        sender: msg.sender,
        timestamp: msg.timestamp,
        type: msg.type || 'text'
      }))
    });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
} 