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
    
    if (action === 'languages') {
      // Get supported languages
      const integration = await Integration.getByUserAndType(session.user.id, 'google-translate');
      const apiKey = integration?.config.apiKey || process.env.GOOGLE_TRANSLATE_API_KEY;
      
      if (!apiKey) {
        return NextResponse.json({ error: 'Translate API key not configured' }, { status: 400 });
      }

      const languages = await googleIntegrations.getSupportedLanguages(apiKey);
      return NextResponse.json({ languages });
    }

    if (action === 'detect') {
      // Detect language
      const text = searchParams.get('text');
      if (!text) {
        return NextResponse.json({ error: 'Text is required' }, { status: 400 });
      }

      const integration = await Integration.getByUserAndType(session.user.id, 'google-translate');
      const apiKey = integration?.config.apiKey || process.env.GOOGLE_TRANSLATE_API_KEY;
      
      if (!apiKey) {
        return NextResponse.json({ error: 'Translate API key not configured' }, { status: 400 });
      }

      const detection = await googleIntegrations.detectLanguage(text, apiKey);
      return NextResponse.json({ detection });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Translate API error:', error);
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
    const { action } = body;

    if (action === 'translate') {
      // Translate text
      const { text, targetLanguage, sourceLanguage } = body;
      if (!text || !targetLanguage) {
        return NextResponse.json({ error: 'Text and target language are required' }, { status: 400 });
      }

      const integration = await Integration.getByUserAndType(session.user.id, 'google-translate');
      const apiKey = integration?.config.apiKey || process.env.GOOGLE_TRANSLATE_API_KEY;
      
      if (!apiKey) {
        return NextResponse.json({ error: 'Translate API key not configured' }, { status: 400 });
      }

      const result = await googleIntegrations.translateText(text, targetLanguage, sourceLanguage, apiKey);
      return NextResponse.json({ result });
    }

    if (action === 'configure') {
      // Configure API key
      const { apiKey } = body;
      if (!apiKey) {
        return NextResponse.json({ error: 'API key is required' }, { status: 400 });
      }

      const integration = await Integration.createOrUpdate(session.user.id, 'google-translate', {
        name: 'Google Translate',
        description: 'Translate text between languages',
        icon: '🌐',
        status: 'connected',
        config: {
          apiKey
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

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Translate API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
