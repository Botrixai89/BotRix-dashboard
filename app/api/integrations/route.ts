import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Integration from '@/models/Integration';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const integrations = await Integration.getByUser(session.user.id);
    
    return NextResponse.json({ integrations });
  } catch (error) {
    console.error('Integrations API error:', error);
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
    const { action, integrationType, config } = body;

    if (action === 'disconnect') {
      const integration = await Integration.getByUserAndType(session.user.id, integrationType);
      if (integration) {
        integration.status = 'disconnected';
        integration.metadata.disconnectedAt = new Date();
        await integration.save();
      }
      
      return NextResponse.json({ success: true });
    }

    if (action === 'update-config') {
      const integration = await Integration.getByUserAndType(session.user.id, integrationType);
      if (!integration) {
        return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
      }

      // Update configuration
      if (config) {
        Object.assign(integration.config, config);
      }
      
      await integration.save();
      return NextResponse.json({ success: true, integration });
    }

    if (action === 'test-connection') {
      const integration = await Integration.getByUserAndType(session.user.id, integrationType);
      if (!integration) {
        return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
      }

      // Test the connection based on integration type
      try {
        switch (integrationType) {
          case 'google-analytics':
            // Test analytics connection
            break;
          case 'google-calendar':
            // Test calendar connection
            break;
          case 'google-sheets':
            // Test sheets connection
            break;
          case 'google-translate':
            // Test translate connection
            break;
          default:
            return NextResponse.json({ error: 'Unknown integration type' }, { status: 400 });
        }
        
        integration.status = 'connected';
        integration.metadata.lastSync = new Date();
        await integration.save();
        
        return NextResponse.json({ success: true, status: 'connected' });
      } catch (error) {
        integration.status = 'error';
        integration.metadata.errorMessage = error instanceof Error ? error.message : 'Connection failed';
        await integration.save();
        
        return NextResponse.json({ 
          success: false, 
          status: 'error',
          error: error instanceof Error ? error.message : 'Connection failed'
        });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Integrations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
