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
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Embed Code</h1>
            <p className="text-gray-600 mt-1">Integrate your chatbot with your website</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge 
              variant={bot.status === 'active' ? 'default' : 'secondary'}
              className={`${
                bot.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {bot.status}
            </Badge>
            <Button variant="outline" size="sm" className="border-teal-200 text-teal-600 hover:bg-teal-50">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8 space-y-8 min-h-0">
        {/* Widget Test URL */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-teal-600 text-white rounded-lg flex items-center justify-center">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Test Your Widget</CardTitle>
                <CardDescription>
                  Direct URL to test your chat widget in action
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-teal-50 p-6 rounded-xl border border-teal-200">
                <h4 className="font-semibold text-teal-900 mb-3 flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  Widget Test URL:
                </h4>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/test-widget.html?botId=${bot._id}`}
                    className="w-full p-3 pr-20 bg-white border border-teal-300 rounded-lg text-sm font-mono text-teal-800"
                  />
                  <Button
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-teal-600 text-white border-0 hover:bg-teal-700"
                    onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/test-widget.html?botId=${bot._id}`, 'testUrl')}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    {copiedTestUrl ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className="mt-3 flex space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-teal-200 text-teal-600 hover:bg-teal-50"
                    onClick={() => window.open(`/test-widget.html?botId=${bot._id}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-teal-200 text-teal-600 hover:bg-teal-50"
                    onClick={() => window.open(`/test-widget.html?botId=${bot._id}`, '_blank')}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Widget
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widget Integration */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center">
                <Code className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Widget Integration (Advanced)</CardTitle>
                <CardDescription>
                  Full control over widget initialization with custom settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <pre className="bg-gray-50 p-6 rounded-xl overflow-x-auto text-sm font-mono border border-gray-200">
                  <code className="text-gray-800">{generateEmbedCode(bot)}</code>
                </pre>
                <Button
                  size="sm"
                  className="absolute top-4 right-4 bg-teal-600 text-white border-0 hover:bg-teal-700"
                  onClick={() => copyToClipboard(generateEmbedCode(bot), 'code')}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copiedCode ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Simple Widget Integration */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Simple Widget Integration</CardTitle>
                <CardDescription>
                  One-line embed using data attributes (easiest method)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <pre className="bg-gray-50 p-6 rounded-xl overflow-x-auto text-sm font-mono border border-gray-200">
                  <code className="text-gray-800">{generateSimpleEmbedCode(bot)}</code>
                </pre>
                <Button
                  size="sm"
                  className="absolute top-4 right-4 bg-teal-600 text-white border-0 hover:bg-teal-700"
                  onClick={() => copyToClipboard(generateSimpleEmbedCode(bot), 'simple')}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copiedSimple ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Integration */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-teal-600 text-white rounded-lg flex items-center justify-center">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Direct API Integration</CardTitle>
                <CardDescription>
                  For custom implementations using the API directly
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <pre className="bg-gray-50 p-6 rounded-xl overflow-x-auto text-sm font-mono border border-gray-200">
                  <code className="text-gray-800">{generateAPICode(bot)}</code>
                </pre>
                <Button
                  size="sm"
                  className="absolute top-4 right-4 bg-teal-600 text-white border-0 hover:bg-teal-700"
                  onClick={() => copyToClipboard(generateAPICode(bot), 'api')}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copiedAPI ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Integration */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 text-white rounded-lg flex items-center justify-center">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Webhook Integration</CardTitle>
                <CardDescription>
                  How your bot communicates with automation
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Current Webhook URL:
                </h4>
                <code className="text-sm text-blue-800 break-all bg-white/70 px-3 py-2 rounded-lg">
                  {bot.settings.webhookUrl}
                </code>
              </div>

              <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                <h4 className="font-semibold text-green-900 mb-3">
                  Webhook Payload:
                </h4>
                <pre className="text-xs text-green-800 overflow-x-auto bg-white/70 p-4 rounded-lg">
{`{
  "botId": "${bot._id}",
  "conversationId": "conversation-id",
  "message": "user message",
  "userInfo": {
    "ip": "user-ip",
    "userAgent": "user-agent"
  },
  "botSettings": {
    "welcomeMessage": "${bot.settings.welcomeMessage}",
    "fallbackMessage": "Sorry, I didn't understand"
  },
  "conversationHistory": [...previous messages]
}`}
                </pre>
              </div>

              <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-3">
                  Expected Webhook Response:
                </h4>
                <pre className="text-xs text-yellow-800 overflow-x-auto bg-white/70 p-4 rounded-lg">
{`{
  "message": "Bot response text",
  // or alternatively:
  "response": "Bot response text"
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 