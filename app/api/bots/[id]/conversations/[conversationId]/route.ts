import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; conversationId: string } }
) {
  try {
    console.log('🔍 Conversation messages API called with params:', params);
    
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
    
    // Get conversation with messages
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
    
    console.log('✅ Found conversation with', conversation.messages.length, 'messages');
    
    // Transform messages for frontend
    const messages = conversation.messages.map(msg => ({
      _id: msg._id,
      content: msg.content,
      sender: msg.sender,
      timestamp: msg.timestamp,
      type: msg.type || 'text'
    }));
    
    return NextResponse.json({
      success: true,
      conversation: {
        _id: conversation._id,
        status: conversation.status,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        userInfo: conversation.userInfo || {},
        botInfo: conversation.botId,
        messages: messages
      }
    });

  } catch (error) {
    console.error('❌ Error fetching conversation messages:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: 'Failed to fetch conversation messages', details: error.message },
      { status: 500 }
    );
  }
} 