'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Copy, ExternalLink, Settings, Eye, Code, Zap, Sparkles, Globe, TestTube } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loading } from '@/components/ui/loading'

interface Bot {
  _id: string;
  name: string;
  settings: {
    primaryColor: string;
    webhookUrl: string;
    welcomeMessage: string;
    widgetIcon?: string;
    widgetIconType: 'default' | 'custom' | 'emoji';
    widgetIconEmoji: string;
    theme: 'modern' | 'minimal' | 'gradient';
  };
  status: string;
}

export default function EmbedPage() {
  const params = useParams()
  const [bot, setBot] = useState<Bot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedSimple, setCopiedSimple] = useState(false)
  const [copiedTestUrl, setCopiedTestUrl] = useState(false)
  const [copiedAPI, setCopiedAPI] = useState(false)

  useEffect(() => {
    fetchBot()
  }, [params.id])

  const fetchBot = async () => {
    try {
      const response = await fetch(`/api/bots/${params.id}`)
      const result = await response.json()

      if (response.ok) {
        setBot(result.bot)
      } else {
        setError(result.error || 'Failed to fetch bot')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const generateEmbedCode = (bot: Bot) => {
    const domain = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
    return `<!-- Botrix Chat Widget -->
<script>
  (function() {
    // Load the chat widget
    const script = document.createElement('script');
    script.src = '${domain}/widget.js';
    script.onload = function() {
      // Initialize chat widget with webhook integration
      window.BotrixChat.createWidget('${bot._id}', {
        primaryColor: '${bot.settings.primaryColor}',
        position: 'bottom-right',
        welcomeMessage: '${bot.settings.welcomeMessage}',
        baseUrl: '${domain}', // Your Botrix domain
        theme: '${bot.settings.theme || 'modern'}', // Apply theme styling
        // Widget icon settings are automatically loaded from bot configuration
      });
    };
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`
  }

  const generateSimpleEmbedCode = (bot: Bot) => {
    const domain = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
    return `<!-- Botrix Chat Widget (Simple Version) -->
<script 
  src="${domain}/widget.js"
  data-botrix-bot-id="${bot._id}"
  data-botrix-primary-color="${bot.settings.primaryColor}"
  data-botrix-position="bottom-right"
  data-botrix-welcome-message="${bot.settings.welcomeMessage}"
  data-botrix-theme="${bot.settings.theme || 'modern'}"
  async>
</script>`
  }

  const generateAPICode = (bot: Bot) => {
    return `<!-- Alternative: Direct API integration -->
<script>
  // Direct API integration for custom implementations
  const BOTRIX_API = {
    botId: '${bot._id}',
    baseUrl: 'https://your-domain.com', // Replace with your actual domain
    async sendMessage(message, conversationId = null) {
      const response = await fetch(this.baseUrl + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: this.botId,
          message: message,
          conversationId: conversationId,
          userInfo: {
            ip: 'client-ip',
            userAgent: navigator.userAgent
          }
        })
      });
      return response.json();
    }
  };
</script>`
  }

  const copyToClipboard = async (text: string, type: 'code' | 'simple' | 'api' | 'testUrl') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'code') {
        setCopiedCode(true)
        setTimeout(() => setCopiedCode(false), 2000)
      } else if (type === 'simple') {
        setCopiedSimple(true)
        setTimeout(() => setCopiedSimple(false), 2000)
      } else if (type === 'testUrl') {
        setCopiedTestUrl(true)
        setTimeout(() => setCopiedTestUrl(false), 2000)
      } else {
        setCopiedAPI(true)
        setTimeout(() => setCopiedAPI(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy text: ', err)
  }
}

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-8 py-6 shadow-sm flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-900">Embed Code</h1>
        </header>
        <main className="flex-1 p-8 min-h-0">
          <div className="flex items-center justify-center h-64">
            <Loading size="lg" text="Loading embed code..." />
          </div>
        </main>
      </div>
    )
  }

  if (error || !bot) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-8 py-6 shadow-sm flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-900">Embed Code</h1>
        </header>
        <main className="flex-1 p-8 min-h-0">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="p-4 rounded-full bg-red-100 text-red-600 mb-4 inline-block">
                <Code className="h-8 w-8" />
              </div>
              <div className="text-red-600 font-medium">{error || 'Bot not found'}</div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 shadow-sm">
        <div className="flex flex-col space-y-3">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Embed Code</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Integrate your chatbot with your website</p>
            </div>
            <Badge 
              variant={bot.status === 'active' ? 'default' : 'secondary'}
              className={`flex-shrink-0 text-xs sm:text-sm px-2 py-1 ${
                bot.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {bot.status}
            </Badge>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-teal-200 text-teal-600 hover:bg-teal-50 py-2.5 px-4 text-sm w-full sm:w-auto sm:self-start min-h-[44px]"
            onClick={() => window.open(`/test-widget.html?botId=${bot._id}`, '_blank')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview Widget
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto w-full">
        {/* Widget Test URL */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
          <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-start sm:items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-600 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                <Eye className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">Test Your Widget</CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 mt-1">
                  Direct URL to test your chat widget in action
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="bg-teal-50 p-3 sm:p-4 rounded-xl border border-teal-200">
              <div className="flex items-center mb-3">
                <Globe className="w-4 h-4 mr-2 text-teal-600 flex-shrink-0" />
                <span className="font-medium text-teal-900 text-sm sm:text-base">Widget Test URL:</span>
              </div>
              
              <div className="bg-white rounded-lg border border-teal-300 p-2 sm:p-3 mb-3 overflow-hidden">
                <div className="text-xs sm:text-sm font-mono text-teal-800 break-all leading-relaxed">
                  {`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/test-widget.html?botId=${bot._id}`}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  className="bg-teal-600 text-white hover:bg-teal-700 py-2.5 px-4 rounded-lg font-medium text-sm flex-1 sm:flex-none sm:min-w-[120px]"
                  onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/test-widget.html?botId=${bot._id}`, 'testUrl')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copiedTestUrl ? 'Copied!' : 'Copy URL'}
                </Button>
                
                <Button
                  variant="outline"
                  className="border-teal-200 text-teal-600 hover:bg-teal-50 py-2.5 px-4 rounded-lg font-medium text-sm flex-1 sm:flex-none sm:min-w-[140px]"
                  onClick={() => window.open(`/test-widget.html?botId=${bot._id}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
                
                <Button
                  variant="outline"
                  className="border-teal-200 text-teal-600 hover:bg-teal-50 py-2.5 px-4 rounded-lg font-medium text-sm flex-1 sm:flex-none sm:min-w-[120px]"
                  onClick={() => window.open(`/test-widget.html?botId=${bot._id}`, '_blank')}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Widget
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widget Integration */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
          <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-start sm:items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                <Code className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">Widget Integration (Advanced)</CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 mt-1">
                  Full control over widget initialization with custom settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 sm:p-4 mb-4">
              <div className="max-h-48 sm:max-h-60 overflow-y-auto">
                <pre className="text-xs sm:text-sm font-mono text-gray-800 whitespace-pre-wrap leading-relaxed">
                  <code>{generateEmbedCode(bot)}</code>
                </pre>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button
                className="bg-blue-600 text-white hover:bg-blue-700 py-2.5 px-4 rounded-lg font-medium text-sm w-full sm:w-auto"
                onClick={() => copyToClipboard(generateEmbedCode(bot), 'code')}
              >
                <Copy className="h-4 w-4 mr-2" />
                {copiedCode ? 'Copied!' : 'Copy Integration Code'}
              </Button>
            </div>
          </CardContent>
        </Card>


      </main>
    </div>
  )
} 