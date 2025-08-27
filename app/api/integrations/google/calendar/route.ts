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
      const authUrl = googleIntegrations.getOAuthUrl('calendar', state);
      return NextResponse.json({ authUrl });
    }
    
    if (action === 'events') {
      // Get calendar events
      const integration = await Integration.getByUserAndType(session.user.id, 'google-calendar');
      if (!integration || integration.status !== 'connected') {
        return NextResponse.json({ error: 'Calendar not connected' }, { status: 400 });
      }

      const calendarId = searchParams.get('calendarId') || integration.config.calendarId || 'primary';
      const maxResults = parseInt(searchParams.get('maxResults') || '10');

      const events = await googleIntegrations.getCalendarEvents(
        integration.config.accessToken!,
        calendarId,
        maxResults
      );

      return NextResponse.json({ events });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Calendar API error:', error);
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
    const { code, state, action } = body;

    if (action === 'connect') {
      if (!code) {
        return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 });
      }

      // Exchange code for token
      const tokenData = await googleIntegrations.exchangeCodeForToken('calendar', code);
      
      // Save integration
      const integration = await Integration.createOrUpdate(session.user.id, 'google-calendar', {
        name: 'Google Calendar',
        description: 'Manage calendar events and scheduling',
        icon: '📅',
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
    }

    if (action === 'create-event') {
      // Create calendar event
      const integration = await Integration.getByUserAndType(session.user.id, 'google-calendar');
      if (!integration || integration.status !== 'connected') {
        return NextResponse.json({ error: 'Calendar not connected' }, { status: 400 });
      }

      const { event, calendarId = 'primary' } = body;
      if (!event || !event.summary || !event.start || !event.end) {
        return NextResponse.json({ error: 'Event details are required' }, { status: 400 });
      }

      const createdEvent = await googleIntegrations.createCalendarEvent(
        integration.config.accessToken!,
        event,
        calendarId
      );

      return NextResponse.json({ event: createdEvent });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
