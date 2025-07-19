import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Bot from '@/models/Bot';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get all bots in the database
    const allBots = await Bot.find({}).sort({ createdAt: -1 });
    
    // Get the current user's ID from cookies if available
    const token = request.cookies.get('auth-token')?.value;
    let currentUserId = null;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
        const payload = jwt.verify(token, JWT_SECRET);
        currentUserId = payload.userId;
      } catch (error) {
        console.log('Token verification failed:', error);
      }
    }
    
    return NextResponse.json({
      success: true,
      allBots: allBots.map(bot => ({
        _id: bot._id,
        name: bot.name,
        userId: bot.userId,
        createdAt: bot.createdAt,
        isCurrentUser: bot.userId?.toString() === currentUserId
      })),
      currentUserId,
      totalBots: allBots.length,
      userBots: allBots.filter(bot => bot.userId?.toString() === currentUserId).length
    });

  } catch (error) {
    console.error('Error fetching debug bots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug bots' },
      { status: 500 }
    );
  }
} 