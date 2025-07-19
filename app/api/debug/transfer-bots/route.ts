import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Bot from '@/models/Bot';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const body = await request.json();
    const { oldUserId } = body;

    if (!oldUserId) {
      return NextResponse.json(
        { error: 'Old user ID is required' },
        { status: 400 }
      );
    }

    // Find all bots associated with the old user ID
    const botsToTransfer = await Bot.find({ userId: oldUserId });
    
    if (botsToTransfer.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No bots found to transfer',
        transferredCount: 0
      });
    }

    // Update all bots to be associated with the current user
    const updateResult = await Bot.updateMany(
      { userId: oldUserId },
      { userId: currentUser._id }
    );

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ${updateResult.modifiedCount} bots`,
      transferredCount: updateResult.modifiedCount,
      oldUserId,
      newUserId: currentUser._id
    });

  } catch (error) {
    console.error('Error transferring bots:', error);
    return NextResponse.json(
      { error: 'Failed to transfer bots' },
      { status: 500 }
    );
  }
} 