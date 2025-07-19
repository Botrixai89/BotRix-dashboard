import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhookUrl, testMessage } = body;

    if (!webhookUrl || !testMessage) {
      return NextResponse.json(
        { error: 'webhookUrl and testMessage are required' },
        { status: 400 }
      );
    }

    console.log('🧪 Testing webhook:', webhookUrl);

    // Test payload that matches the exact format from the working bot
    const testPayload = {
      type: "text",
      content: {
        text: testMessage
      }
    };

    console.log('📤 Sending test payload:', JSON.stringify(testPayload, null, 2));

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Botrix-Debug-Tool/1.0'
      },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(30000),
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { rawResponse: responseText };
    }

    const result = {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      response: responseData,
      requestPayload: testPayload
    };

    console.log('📡 Test result:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('💥 Debug webhook error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 