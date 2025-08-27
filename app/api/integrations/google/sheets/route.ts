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
      const authUrl = googleIntegrations.getOAuthUrl('sheets', state);
      return NextResponse.json({ authUrl });
    }
    
    if (action === 'read') {
      // Read sheet data
      const integration = await Integration.getByUserAndType(session.user.id, 'google-sheets');
      if (!integration || integration.status !== 'connected') {
        return NextResponse.json({ error: 'Sheets not connected' }, { status: 400 });
      }

      const spreadsheetId = searchParams.get('spreadsheetId') || integration.config.spreadsheetId;
      const range = searchParams.get('range') || 'A1:Z1000';

      if (!spreadsheetId) {
        return NextResponse.json({ error: 'Spreadsheet ID is required' }, { status: 400 });
      }

      const data = await googleIntegrations.readSheetData(
        integration.config.accessToken!,
        spreadsheetId,
        range
      );

      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Sheets API error:', error);
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
      const tokenData = await googleIntegrations.exchangeCodeForToken('sheets', code);
      
      // Save integration
      const integration = await Integration.createOrUpdate(session.user.id, 'google-sheets', {
        name: 'Google Sheets',
        description: 'Read and write spreadsheet data',
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
    }

    if (action === 'write') {
      // Write to sheet
      const integration = await Integration.getByUserAndType(session.user.id, 'google-sheets');
      if (!integration || integration.status !== 'connected') {
        return NextResponse.json({ error: 'Sheets not connected' }, { status: 400 });
      }

      const { spreadsheetId, range, values } = body;
      if (!spreadsheetId || !range || !values) {
        return NextResponse.json({ error: 'Spreadsheet ID, range, and values are required' }, { status: 400 });
      }

      await googleIntegrations.writeSheetData(
        integration.config.accessToken!,
        spreadsheetId,
        range,
        values
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Sheets API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
