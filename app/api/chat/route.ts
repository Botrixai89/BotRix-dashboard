import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Bot from '@/models/Bot';
import Conversation from '@/models/Conversation';
import { getRandomName } from '@/lib/utils';
import { ruleBasedBotService } from '@/lib/rule-based-bot';

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

    // Get IP and userAgent from request headers if not provided
    const ip = userInfo?.ip && userInfo.ip !== 'client-ip' ? userInfo.ip : request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.ip || 'unknown';
    const userAgent = userInfo?.userAgent || request.headers.get('user-agent') || 'unknown';

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
    });

    // Find or create conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }
    // If no conversationId, try to find by botId, ip, and userAgent (not closed)
    if (!conversation) {
      conversation = await Conversation.findOne({
        botId,
        'userInfo.ip': ip,
        'userInfo.userAgent': userAgent,
        status: { $ne: 'closed' },
      });
    }
    // If still not found, create new
    if (!conversation) {
      conversation = new Conversation({
        botId,
        userInfo: {
          name: userInfo?.name || null,
          email: userInfo?.email || null,
          ip,
          userAgent,
        },
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

    // If user's name is not set, check if this is a name response
    if (!conversation.userInfo.name) {
      // If the last bot message was a name prompt, treat this as the name response
      const lastBotMsg = conversation.messages.slice(-2, -1)[0];
      if (lastBotMsg && lastBotMsg.sender === 'bot' && lastBotMsg.content.includes('your name')) {
        const trimmed = message.trim().toLowerCase();
        const skipKeywords = ['no', 'skip', 'anonymous', 'none', 'n/a', 'not sure', 'rather not say', 'prefer not to say'];
        
        if (!trimmed || skipKeywords.some(keyword => trimmed.includes(keyword))) {
          conversation.userInfo.name = getRandomName();
          console.log(`User chose to skip name, assigned random name: ${conversation.userInfo.name}`);
        } else {
          // Clean and validate the name
          const cleanedName = message.trim().replace(/[^\w\s-]/g, ''); // Remove special characters except spaces and hyphens
          if (cleanedName.length > 0 && cleanedName.length <= 50) {
            // Capitalize first letter of each word
            conversation.userInfo.name = cleanedName.split(' ').map((word: string) => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
            console.log(`User provided name: ${conversation.userInfo.name}`);
          } else {
            conversation.userInfo.name = getRandomName();
            console.log(`Invalid name provided, assigned random name: ${conversation.userInfo.name}`);
          }
        }
      }
    }

    // If this is the first user message, send greeting and name prompt
    if (conversation.messages.length === 1) {
      const greeting = bot.settings.welcomeMessage || 'Hello! How can I help you today?';
      const botMessage1 = {
        content: greeting,
        sender: 'bot' as const,
        timestamp: new Date(),
      };
      const botMessage2 = {
        content: 'May I know your name please? (You can say "skip" if you prefer a random name)',
        sender: 'bot' as const,
        timestamp: new Date(),
      };
      conversation.messages.push(botMessage1, botMessage2);
      await conversation.save();
      const responseData = [
        {
          content: greeting,
          _id: conversation._id,
          sender: 'bot',
          type: 'text',
          createdAt: new Date().toISOString(),
          voiceSettings: bot.settings.voiceEnabled ? bot.settings.voiceSettings : null,
          userInfo: conversation.userInfo
        },
        {
          content: 'May I know your name please? (You can say "skip" if you prefer a random name)',
          _id: conversation._id,
          sender: 'bot',
          type: 'text',
          createdAt: new Date().toISOString(),
          voiceSettings: bot.settings.voiceEnabled ? bot.settings.voiceSettings : null,
          userInfo: conversation.userInfo
        }
      ];
      return NextResponse.json(responseData, { headers: corsHeaders });
    }

    // Save conversation
    await conversation.save();

    // Check bot type and handle accordingly
    const botType = bot.settings.botType || 'webhook';
    console.log('🤖 Bot type:', botType);

    // Handle rule-based bot first
    if (botType === 'rule-based' || botType === 'hybrid') {
      if (bot.settings.ruleBasedConfig?.enabled) {
        console.log('🎯 Executing rule-based bot logic');
        
        // Execute rules with conversation context
        const context = {
          message,
          conversationId: conversation._id.toString(),
          userInfo: conversation.userInfo,
          botId: bot._id.toString(),
          timestamp: new Date().toISOString()
        };

        const ruleResult = await ruleBasedBotService.executeRules(bot, message, context);
        
        if (ruleResult.matched) {
          console.log('✅ Rule matched, executing actions');
          
          // Add bot response to conversation
          if (ruleResult.response) {
            const botMessage = {
              content: ruleResult.response,
              sender: 'bot' as const,
              timestamp: new Date(),
            };
            conversation.messages.push(botMessage);
            await conversation.save();

            // Return response
            const responseData = [
              {
                content: ruleResult.response, // Use string content directly
                _id: conversation._id,
                sender: "bot",
                type: "text",
                createdAt: new Date().toISOString(),
                voiceSettings: bot.settings.voiceEnabled ? bot.settings.voiceSettings : null
              }
            ];

            // Add image response if available
            if (ruleResult.imageUrl) {
              responseData.push({
                content: ruleResult.imageUrl, // Use string content for image URL
                _id: conversation._id,
                sender: "bot",
                type: "image",
                createdAt: new Date().toISOString(),
                voiceSettings: null
              });
            }

            return NextResponse.json(responseData, {
              headers: corsHeaders,
            });
          }
        } else {
          console.log('❌ No rules matched');
        }
      }
    }

    // For hybrid bots or when rules don't match, fall back to webhook
    if (botType === 'webhook' || botType === 'hybrid') {
      // Check if webhook URL is configured
      if (!bot.settings.webhookUrl || bot.settings.webhookUrl.trim() === '') {
        console.log('❌ No webhook URL configured for this bot');
        
        // Add fallback response to conversation
        const fallbackMessage = {
          content: bot.settings.fallbackMessage || "I'm sorry, I'm not configured to respond right now. Please check the bot settings.",
          sender: 'bot' as const,
          timestamp: new Date(),
        };
        conversation.messages.push(fallbackMessage);
        await conversation.save();

        // Return fallback response
        const responseData = [
          {
            content: fallbackMessage.content,
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
    } else {
      // For rule-based only bots with no matching rules
      const fallbackMessage = {
        content: bot.settings.fallbackMessage || "I'm sorry, I didn't understand that. Can you please rephrase?",
        sender: 'bot' as const,
        timestamp: new Date(),
      };
      conversation.messages.push(fallbackMessage);
      await conversation.save();

      const responseData = [
        {
          content: fallbackMessage.content,
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
          
        } catch (fetchError: unknown) {
          const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
          lastError = errorMessage;
          console.error(`❌ Webhook attempt ${attempt} failed:`, errorMessage);
          
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
          // Format: [{ content: "...", sender: "bot", type: "text", ... }]
          const firstMessage = responseData[0];
          if (firstMessage.content && typeof firstMessage.content === 'string') {
            botResponse = firstMessage.content;
          } else if (firstMessage.content && firstMessage.content.text) {
            // Fallback for old format
            botResponse = firstMessage.content.text;
          } else {
            botResponse = bot.settings.fallbackMessage;
          }
        } else if (responseData.content && typeof responseData.content === 'string') {
          // Format: { content: "..." }
          botResponse = responseData.content;
        } else if (responseData.content && responseData.content.text) {
          // Fallback for old format: { content: { text: "..." } }
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
            } catch (e: unknown) {
              // If not JSON, use the raw text
              errorDetails = errorText;
            }
          } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            console.error('❌ Could not read error response:', errorMessage);
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
          content: botResponse,
          _id: conversation._id,
          sender: "bot",
          type: "text",
          createdAt: new Date().toISOString(),
          voiceSettings: bot.settings.voiceEnabled ? bot.settings.voiceSettings : null,
          userInfo: conversation.userInfo
        }
      ];

      return NextResponse.json(responseData, {
        headers: corsHeaders,
      });

    } catch (webhookError: unknown) {
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
          voiceSettings: bot.settings.voiceEnabled ? bot.settings.voiceSettings : null,
          userInfo: conversation.userInfo
        }
      ];

      return NextResponse.json(responseData, {
        headers: corsHeaders,
      });
    }

  } catch (error: unknown) {
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