import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Bot from '@/models/Bot';

// Define the webhook test result interface
interface WebhookTestResult {
  status: 'not_tested' | 'success' | 'error' | 'demo_mode';
  message: string;
  statusCode?: number;
  response?: any;
  error?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const bot = await Bot.findById(params.id);
    if (!bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      );
    }

    // Test webhook connectivity
    let webhookTest: WebhookTestResult = { status: 'not_tested', message: 'Webhook not tested' };
    
    if (bot.settings.webhookUrl && 
        !bot.settings.webhookUrl.includes('placeholder') && 
        bot.settings.webhookUrl !== 'https://automation.botrixai.com/webhook/8b0df4ab-cb69-48d7-b3f4-d8a68a420ef8/chat') {
      
      try {
        console.log('🧪 Testing webhook:', bot.settings.webhookUrl);
        
        const testResponse = await fetch(bot.settings.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: "text",
            content: {
              text: "Test message from Botrix Dashboard"
            }
          }),
        });

        if (testResponse.ok) {
          const responseData = await testResponse.json();
          webhookTest = {
            status: 'success',
            statusCode: testResponse.status,
            response: responseData,
            message: 'Webhook is responding correctly'
          };
        } else {
          const errorText = await testResponse.text();
          webhookTest = {
            status: 'error',
            statusCode: testResponse.status,
            error: errorText,
            message: `Webhook returned ${testResponse.status} error`
          };
        }
      } catch (error: any) {
        webhookTest = {
          status: 'error',
          error: error.message,
          message: 'Failed to connect to webhook'
        };
      }
    } else {
      webhookTest = {
        status: 'demo_mode',
        message: 'Bot is using demo webhook URL - configure your webhook for real responses'
      };
    }

    return NextResponse.json({
      bot: {
        id: bot._id,
        name: bot.name,
        status: bot.status,
        settings: {
          webhookUrl: bot.settings.webhookUrl,
          welcomeMessage: bot.settings.welcomeMessage,
          fallbackMessage: bot.settings.fallbackMessage,
          primaryColor: bot.settings.primaryColor
        }
      },
      webhookTest,
      recommendations: [
        bot.settings.webhookUrl.includes('placeholder') ? 
          '⚠️  Update your webhook URL to a real endpoint' : 
          '✅ Webhook URL looks configured',
        webhookTest.status === 'success' ? 
          '✅ Webhook is responding correctly' : 
          '❌ Webhook needs to be fixed or configured',
        bot.status === 'active' ? 
          '✅ Bot is active' : 
          '⚠️  Set bot status to active for production use'
      ]
    });

  } catch (error: unknown) {
    console.error('Error testing bot:', error);
    return NextResponse.json(
      { error: 'Failed to test bot configuration' },
      { status: 500 }
    );
  }
} 