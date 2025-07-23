import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// Define the message interface to match the schema
interface Message {
  _id: string;
  content: string;
  sender: 'bot' | 'user' | 'agent';
  timestamp: Date;
  type?: 'text' | 'image' | 'file' | 'button';
  metadata?: any;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Conversations API called with params:', params);
    
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
    
    const botId = params.id;
    console.log('🤖 Bot ID:', botId);
    
    // Validate bot ID format
    if (!botId || !mongoose.Types.ObjectId.isValid(botId)) {
      console.log('❌ Invalid bot ID format:', botId);
      return NextResponse.json(
        { error: 'Invalid bot ID format' },
        { status: 400 }
      );
    }
    
    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    
    // Build query
    let query: any = { botId };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { 'messages.content': { $regex: search, $options: 'i' } },
        { 'userInfo.name': { $regex: search, $options: 'i' } },
        { 'userInfo.email': { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('🔍 Query:', JSON.stringify(query, null, 2));
    
    // Get conversations with pagination
    const conversations = await Conversation.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('botId', 'name')
      .lean();
    
    console.log('✅ Found conversations:', conversations.length);
    
    // Get total count for pagination
    const totalCount = await Conversation.countDocuments(query);
    console.log('📊 Total count:', totalCount);
    
    // Transform conversations to include summary data
    const transformedConversations = conversations.map(conv => {
      const lastMessage = conv.messages[conv.messages.length - 1];
      const userMessages = conv.messages.filter((m: Message) => m.sender === 'user');
      const botMessages = conv.messages.filter((m: Message) => m.sender === 'bot');
      
      return {
        _id: conv._id,
        status: conv.status,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          sender: lastMessage.sender,
          timestamp: lastMessage.timestamp
        } : null,
        messageCount: conv.messages.length,
        userMessageCount: userMessages.length,
        botMessageCount: botMessages.length,
        userInfo: conv.userInfo || {},
        unreadCount: conv.status === 'new' ? 1 : 0,
        duration: conv.updatedAt - conv.createdAt
      };
    });
    
    return NextResponse.json({
      success: true,
      conversations: transformedConversations,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching conversations:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: 'Failed to fetch conversations', details: error.message },
      { status: 500 }
    );
  }
} 