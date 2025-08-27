import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { googleIntegrations } from '@/lib/google-integrations';
import Integration from '@/models/Integration';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'auth') {
      // Generate OAuth URL
      const state = Buffer.from(JSON.stringify({ userId: session.user.id })).toString('base64');
      const authUrl = googleIntegrations.getOAuthUrl('analytics', state);
      return NextResponse.json({ authUrl });
    }
    
    if (action === 'data') {
      // Get analytics data
      const integration = await Integration.getByUserAndType(session.user.id, 'google-analytics');
      if (!integration || integration.status !== 'connected') {
        return NextResponse.json({ error: 'Analytics not connected' }, { status: 400 });
      }

      const viewId = searchParams.get('viewId') || integration.config.viewId;
      const startDate = searchParams.get('startDate') || '7daysAgo';
      const endDate = searchParams.get('endDate') || 'today';

      if (!viewId) {
        return NextResponse.json({ error: 'View ID is required' }, { status: 400 });
      }

      const data = await googleIntegrations.getAnalyticsData(
        integration.config.accessToken!,
        viewId,
        startDate,
        endDate
      );

      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();
    const { code, state } = body;

    if (!code) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 });
    }

    // Exchange code for token
    const tokenData = await googleIntegrations.exchangeCodeForToken('analytics', code);
    
    // Save integration
    const integration = await Integration.createOrUpdate(session.user.id, 'google-analytics', {
      name: 'Google Analytics',
      description: 'Track website traffic and user behavior',
      icon: '📊',
      status: 'connected',
      config: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined
      }
    });

    return NextResponse.json({ 
      success: true, 
      integration: {
        id: integration._id,
        type: integration.type,
        status: integration.status
      }
    });
  } catch (error) {
    console.error('Analytics connection error:', error);
    return NextResponse.json(
      { error: 'Failed to connect Analytics' },
      { status: 500 }
    );
  }
}
