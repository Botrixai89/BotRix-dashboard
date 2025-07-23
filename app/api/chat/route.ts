import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Bot from '@/models/Bot';
import Conversation from '@/models/Conversation';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Handle preflight OPTIONS requests
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    
    // Handle both old and new payload formats
    let botId, message, conversationId, userInfo;
    
    if (body.type === "text" && body.content && body.content.text) {
      // New format matching working bot
      message = body.content.text;
      botId = body._botId;
      conversationId = body._conversationId;
      userInfo = body._userInfo;
    } else {
      // Old format for backward compatibility
      botId = body.botId;
      message = body.message;
      conversationId = body.conversationId;
      userInfo = body.userInfo;
    }

    console.log('📥 Chat API Request:', { botId, message, conversationId, format: body.type ? 'new' : 'old' });

    // Validate required fields
    if (!botId || !message) {
      return NextResponse.json(
        { error: 'botId and message are required' },
        { 
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Get bot with webhook URL
    const bot = await Bot.findById(botId);
    if (!bot) {
      console.error('❌ Bot not found:', botId);
      return NextResponse.json(
        { error: 'Bot not found' },
        { 
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    console.log('🤖 Bot found:', { 
      name: bot.name, 
      webhookUrl: bot.settings.webhookUrl,
      fallbackMessage: bot.settings.fallbackMessage,
      isDemoWebhook: bot.settings.webhookUrl === 'https://automation.botrixai.com/webhook/8b0df4ab-cb69-48d7-b3f4-d8a68a420ef8/chat'
    });

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }
    
    if (!conversation) {
      conversation = new Conversation({
        botId,
        userInfo: userInfo || { ip: 'unknown', userAgent: 'unknown' },
        messages: [],
        status: 'new',
        tags: [],
      });
    }

    // Add user message to conversation
    const userMessage = {
      content: message,
      sender: 'user' as const,
      timestamp: new Date(),
    };
    conversation.messages.push(userMessage);

    // Check if webhook URL is properly configured
    const isDemoWebhook = bot.settings.webhookUrl.includes('placeholder') || 
                         (!bot.settings.webhookUrl || bot.settings.webhookUrl === '');
    
    if (isDemoWebhook) {
      console.log('⚠️  Using demo mode - webhook URL not configured properly');
      console.log('🔧 Bot is using demo webhook URL. Please configure your webhook URL in the bot settings.');
      
      // Provide demo responses for testing
      const demoResponses = [
        "Hello! This is a demo response. To get real AI responses, please configure your webhook URL.",
        "I'm working in demo mode! Connect your automation workflow to get intelligent responses.",
        "Demo response: I can see your message! Set up your webhook to enable real conversations.",
        "This is a test response. Your chat widget is working perfectly - now connect your AI workflow!",
      ];
      
      const demoResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];
      
      // Add bot response to conversation
      const botMessage = {
        content: demoResponse,
        sender: 'bot' as const,
        timestamp: new Date(),
      };
      conversation.messages.push(botMessage);
      await conversation.save();

      // Return demo response in the same format as the working bot
      const responseData = [
        {
          content: {
            text: demoResponse
          },
          _id: conversation._id,
          sender: "bot",
          type: "text",
          createdAt: new Date().toISOString(),
          voiceSettings: bot.settings.voiceEnabled ? bot.settings.voiceSettings : null
        }
      ];

      return NextResponse.json(responseData, {
        headers: corsHeaders,
      });
    }

    // Try to call the webhook
    try {
      // Create payload matching the exact format from working bot
      const sessionId = `widget_${botId}_${Date.now()}`;
      const webhookPayload = {
        action: "sendMessage",
        sessionId: sessionId,
        chatInput: message,
        message: message,
        timestamp: new Date().toISOString()
      };

      console.log('📤 Calling webhook:', {
        url: bot.settings.webhookUrl,
        payload: webhookPayload
      });

      console.log('🔍 Webhook URL being used:', bot.settings.webhookUrl);

      // Retry mechanism for webhook calls
      let webhookResponse;
      let lastError;
      const maxRetries = 2;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔄 Webhook attempt ${attempt}/${maxRetries}`);
          
          webhookResponse = await fetch(bot.settings.webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Botrix-Chat-API/1.0'
            },
            body: JSON.stringify(webhookPayload),
            signal: AbortSignal.timeout(30000), // 30 second timeout
          });
          
          // If successful, break out of retry loop
          if (webhookResponse.ok) {
            break;
          }
          
          // If it's a 5xx error, retry; otherwise, don't retry
          if (webhookResponse.status < 500) {
            break;
          }
          
          lastError = `HTTP ${webhookResponse.status}: ${webhookResponse.statusText}`;
          
          if (attempt < maxRetries) {
            console.log(`⏳ Retrying in 1 second... (attempt ${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (fetchError) {
          lastError = fetchError.message;
          console.error(`❌ Webhook attempt ${attempt} failed:`, fetchError.message);
          
          if (attempt < maxRetries) {
            console.log(`⏳ Retrying in 1 second... (attempt ${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      console.log('📡 Webhook response status:', webhookResponse?.status || 'No response');

      let botResponse;
      if (webhookResponse && webhookResponse.ok) {
        const responseData = await webhookResponse.json();
        console.log('✅ Webhook response data:', responseData);
        
        // Handle response format matching the working bot
        if (responseData.output) {
          // Format: { output: "..." } - This is the working format
          botResponse = responseData.output;
        } else if (Array.isArray(responseData) && responseData.length > 0) {
          // Format: [{ content: { text: "..." }, sender: "bot", type: "text", ... }]
          const firstMessage = responseData[0];
          if (firstMessage.content && firstMessage.content.text) {
            botResponse = firstMessage.content.text;
          } else {
            botResponse = bot.settings.fallbackMessage;
          }
        } else if (responseData.content && responseData.content.text) {
          // Format: { content: { text: "..." } }
          botResponse = responseData.content.text;
        } else if (responseData.message) {
          // Format: { message: "..." }
          botResponse = responseData.message;
        } else if (responseData.response) {
          // Format: { response: "..." }
          botResponse = responseData.response;
        } else if (responseData.reply) {
          // Format: { reply: "..." }
          botResponse = responseData.reply;
        } else if (responseData.text) {
          // Format: { text: "..." }
          botResponse = responseData.text;
        } else if (typeof responseData === 'string') {
          // Direct string response
          botResponse = responseData;
        } else {
          // Fallback to bot's fallback message
          botResponse = bot.settings.fallbackMessage;
        }
                     
        console.log('💬 Final bot response:', botResponse);
      } else {
        let errorDetails = lastError || 'Unknown error';
        
        if (webhookResponse) {
          try {
            const errorText = await webhookResponse.text();
            console.error('❌ Webhook error:', webhookResponse.status, webhookResponse.statusText, errorText);
            
            // Try to parse error response for better debugging
            try {
              const errorJson = JSON.parse(errorText);
              errorDetails = errorJson.message || errorJson.error || errorText;
            } catch (e) {
              // If not JSON, use the raw text
              errorDetails = errorText;
            }
          } catch (e) {
            console.error('❌ Could not read error response:', e.message);
          }
        }
        
        console.error('🔍 Detailed webhook error:', {
          status: webhookResponse?.status || 'No response',
          statusText: webhookResponse?.statusText || 'No response',
          error: errorDetails,
          url: bot.settings.webhookUrl,
          attempts: maxRetries
        });
        
        botResponse = bot.settings.fallbackMessage;
      }

      // Add bot response to conversation
      const botMessage = {
        content: botResponse,
        sender: 'bot' as const,
        timestamp: new Date(),
      };
      conversation.messages.push(botMessage);

      // Update conversation status if it was new
      if (conversation.status === 'new') {
        conversation.status = 'active';
      }

      // Update bot metrics
      bot.metrics.totalConversations = await Conversation.countDocuments({ botId });
      bot.metrics.newMessages24h = await Conversation.countDocuments({
        botId,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      // Save conversation and bot
      await Promise.all([
        conversation.save(),
        bot.save()
      ]);

      // Return response in the same format as the working bot
      const responseData = [
        {
          content: {
            text: botResponse
          },
          _id: conversation._id,
          sender: "bot",
          type: "text",
          createdAt: new Date().toISOString(),
          voiceSettings: bot.settings.voiceEnabled ? bot.settings.voiceSettings : null
        }
      ];

      return NextResponse.json(responseData, {
        headers: corsHeaders,
      });

    } catch (webhookError) {
      console.error('💥 Error calling webhook:', webhookError);
      
      // Add fallback message to conversation
      const fallbackMessage = {
        content: bot.settings.fallbackMessage,
        sender: 'bot' as const,
        timestamp: new Date(),
      };
      conversation.messages.push(fallbackMessage);
      await conversation.save();

      // Return fallback response in the same format as the working bot
      const responseData = [
        {
          content: {
            text: bot.settings.fallbackMessage
          },
          _id: conversation._id,
          sender: "bot",
          type: "text",
          createdAt: new Date().toISOString(),
          voiceSettings: bot.settings.voiceEnabled ? bot.settings.voiceSettings : null
        }
      ];

      return NextResponse.json(responseData, {
        headers: corsHeaders,
      });
    }

  } catch (error) {
    console.error('💥 Error processing chat message:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { 
        status: 500,
        headers: corsHeaders,
      }
    );
  }
} 