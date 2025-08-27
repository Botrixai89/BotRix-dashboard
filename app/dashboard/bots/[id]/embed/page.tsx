'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Copy, ExternalLink, Settings, Eye, Code, Zap, Sparkles, Globe, TestTube, Workflow, Bot } from 'lucide-react'
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
    return `<!-- Botrix Rule-Based Chat Widget -->
<script>
  (function() {
    // Load the chat widget
    const script = document.createElement('script');
    script.src = '${domain}/widget.js';
    script.onload = function() {
      // Initialize chat widget with rule-based bot
      window.BotrixChat.createWidget('${bot._id}', {
        primaryColor: '${bot.settings.primaryColor}',
        position: 'bottom-right',
        welcomeMessage: '${bot.settings.welcomeMessage}',
        baseUrl: '${domain}',
        theme: '${bot.settings.theme || 'modern'}',
        botType: 'rule-based', // Specify this is a rule-based bot
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
    return `<!-- Botrix Rule-Based Chat Widget (Simple Version) -->
<script 
  src="${domain}/widget.js"
  data-botrix-bot-id="${bot._id}"
  data-botrix-primary-color="${bot.settings.primaryColor}"
  data-botrix-position="bottom-right"
  data-botrix-welcome-message="${bot.settings.welcomeMessage}"
  data-botrix-theme="${bot.settings.theme || 'modern'}"
  data-botrix-bot-type="rule-based"
  async>
</script>`
  }

  const generateAPICode = (bot: Bot) => {
    return `<!-- Alternative: Direct API integration for rule-based bot -->
<script>
  // Direct API integration for custom implementations
  const BOTRIX_API = {
    botId: '${bot._id}',
    baseUrl: 'https://your-domain.com', // Replace with your actual domain
    botType: 'rule-based',
    async sendMessage(message, conversationId = null) {
      const response = await fetch(this.baseUrl + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: this.botId,
          message: message,
          conversationId: conversationId,
          botType: this.botType,
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
      <div className="flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-8 py-6 shadow-sm flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-900">Embed Rule-Based Bot</h1>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <Loading size="lg" text="Loading embed code..." />
          </div>
        </main>
      </div>
    )
  }

  if (error || !bot) {
    return (
      <div className="flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-8 py-6 shadow-sm flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-900">Embed Rule-Based Bot</h1>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">
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
    <div className="flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-teal-100 px-6 py-6 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-teal-600 text-white rounded-xl flex items-center justify-center">
              <Code className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Embed</h1>
              <p className="text-gray-600">Integrate your rule-based chatbot with your website</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge 
              variant="outline"
              className="px-3 py-1 bg-teal-100 text-teal-800 border-teal-200"
            >
              <Workflow className="h-3 w-3 mr-1" />
              Rule-Based
            </Badge>
            <Badge 
              variant={bot.status === 'active' ? 'default' : 'secondary'}
              className={`px-3 py-1 ${
                bot.status === 'active' 
                  ? 'bg-green-100 text-green-800 border-green-200' 
                  : 'bg-yellow-100 text-yellow-800 border-yellow-200'
              }`}
            >
              {bot.status}
            </Badge>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-6 space-y-6 max-w-5xl mx-auto w-full overflow-y-auto">
                 {/* Widget Test URL */}
         <Card className="bg-white rounded-xl shadow-sm border border-teal-200">
           <CardHeader className="px-6 py-5">
             <div className="flex items-center space-x-3">
               <div className="w-12 h-12 bg-teal-600 text-white rounded-xl flex items-center justify-center">
                 <Eye className="h-6 w-6" />
               </div>
               <div>
                 <CardTitle className="text-lg font-semibold text-gray-900">Widget Test URL</CardTitle>
                 <CardDescription className="text-gray-600">
                   Direct URL to test your rule-based chat widget in action
                 </CardDescription>
               </div>
             </div>
           </CardHeader>
           <CardContent className="px-6 pb-6">
             <div className="bg-teal-50 p-4 rounded-xl border border-teal-200">
               <div className="flex items-center mb-3">
                 <Globe className="w-4 h-4 mr-2 text-teal-600" />
                 <span className="font-medium text-teal-900">Widget Test URL:</span>
               </div>
               
               <div className="bg-white rounded-lg border border-teal-300 p-3 mb-4 overflow-hidden">
                 <div className="text-sm font-mono text-teal-800 break-all leading-relaxed">
                   {`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/test-widget.html?botId=${bot._id}`}
                 </div>
               </div>
               
               <div className="flex gap-3">
                 <Button
                   className="bg-teal-600 text-white hover:bg-teal-700 py-2.5 px-4 rounded-lg font-medium"
                   onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/test-widget.html?botId=${bot._id}`, 'testUrl')}
                 >
                   <Copy className="h-4 w-4 mr-2" />
                   {copiedTestUrl ? 'Copied!' : 'Copy URL'}
                 </Button>
                 
                 <Button
                   variant="outline"
                   className="border-teal-200 text-teal-600 hover:bg-teal-50 py-2.5 px-4 rounded-lg font-medium"
                   onClick={() => window.open(`/test-widget.html?botId=${bot._id}`, '_blank')}
                 >
                   <ExternalLink className="h-4 w-4 mr-2" />
                   Open in New Tab
                 </Button>
                 
                 <Button
                   variant="outline"
                   className="border-teal-200 text-teal-600 hover:bg-teal-50 py-2.5 px-4 rounded-lg font-medium"
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
         <Card className="bg-white rounded-xl shadow-sm border border-blue-200">
           <CardHeader className="px-6 py-5">
             <div className="flex items-center space-x-3">
               <div className="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center">
                 <Code className="h-6 w-6" />
               </div>
               <div>
                 <CardTitle className="text-lg font-semibold text-gray-900">Widget Integration (Advanced)</CardTitle>
                 <CardDescription className="text-gray-600">
                   Full control over widget initialization with custom settings for rule-based bot
                 </CardDescription>
               </div>
             </div>
           </CardHeader>
           <CardContent className="px-6 pb-6">
             <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-4">
               <div className="max-h-60 overflow-y-auto">
                 <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap leading-relaxed">
                   <code>{generateEmbedCode(bot)}</code>
                 </pre>
               </div>
             </div>
             
             <div className="flex justify-center">
               <Button
                 className="bg-blue-600 text-white hover:bg-blue-700 py-2.5 px-4 rounded-lg font-medium"
                 onClick={() => copyToClipboard(generateEmbedCode(bot), 'code')}
               >
                 <Copy className="h-4 w-4 mr-2" />
                 {copiedCode ? 'Copied!' : 'Copy Integration Code'}
               </Button>
             </div>
           </CardContent>
         </Card>

                 {/* Simple Integration */}
         <Card className="bg-white rounded-xl shadow-sm border border-green-200">
           <CardHeader className="px-6 py-5">
             <div className="flex items-center space-x-3">
               <div className="w-12 h-12 bg-green-500 text-white rounded-xl flex items-center justify-center">
                 <Zap className="h-6 w-6" />
               </div>
               <div>
                 <CardTitle className="text-lg font-semibold text-gray-900">Simple Integration</CardTitle>
                 <CardDescription className="text-gray-600">
                   Quick and easy integration with minimal configuration
                 </CardDescription>
               </div>
             </div>
           </CardHeader>
           <CardContent className="px-6 pb-6">
             <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-4">
               <div className="max-h-32 overflow-y-auto">
                 <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap leading-relaxed">
                   <code>{generateSimpleEmbedCode(bot)}</code>
                 </pre>
               </div>
             </div>
             
             <div className="flex justify-center">
               <Button
                 className="bg-green-600 text-white hover:bg-green-700 py-2.5 px-4 rounded-lg font-medium"
                 onClick={() => copyToClipboard(generateSimpleEmbedCode(bot), 'simple')}
               >
                 <Copy className="h-4 w-4 mr-2" />
                 {copiedSimple ? 'Copied!' : 'Copy Simple Code'}
               </Button>
             </div>
           </CardContent>
         </Card>

                 {/* API Integration */}
         <Card className="bg-white rounded-xl shadow-sm border border-purple-200">
           <CardHeader className="px-6 py-5">
             <div className="flex items-center space-x-3">
               <div className="w-12 h-12 bg-purple-500 text-white rounded-xl flex items-center justify-center">
                 <Settings className="h-6 w-6" />
               </div>
               <div>
                 <CardTitle className="text-lg font-semibold text-gray-900">API Integration</CardTitle>
                 <CardDescription className="text-gray-600">
                   Direct API integration for custom implementations and rule-based bot logic
                 </CardDescription>
               </div>
             </div>
           </CardHeader>
           <CardContent className="px-6 pb-6">
             <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-4">
               <div className="max-h-60 overflow-y-auto">
                 <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap leading-relaxed">
                   <code>{generateAPICode(bot)}</code>
                 </pre>
               </div>
             </div>
             
             <div className="flex justify-center">
               <Button
                 className="bg-purple-600 text-white hover:bg-purple-700 py-2.5 px-4 rounded-lg font-medium"
                 onClick={() => copyToClipboard(generateAPICode(bot), 'api')}
               >
                 <Copy className="h-4 w-4 mr-2" />
                 {copiedAPI ? 'Copied!' : 'Copy API Code'}
               </Button>
             </div>
           </CardContent>
         </Card>

                 {/* Features Section */}
         <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
           <CardHeader className="px-6 py-5">
             <CardTitle className="text-lg font-semibold text-gray-900">Rule-Based Bot Features</CardTitle>
             <CardDescription className="text-gray-600">
               What makes our rule-based chatbot special
             </CardDescription>
           </CardHeader>
           <CardContent className="px-6 pb-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div className="flex items-start space-x-3">
                 <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                   <Workflow className="h-5 w-5" />
                 </div>
                 <div>
                   <h4 className="font-medium text-gray-900">Visual Flow Builder</h4>
                   <p className="text-sm text-gray-600 mt-1">Drag-and-drop interface for creating conversation flows</p>
                 </div>
               </div>
               
               <div className="flex items-start space-x-3">
                 <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                   <Globe className="h-5 w-5" />
                 </div>
                 <div>
                   <h4 className="font-medium text-gray-900">Webhook Integration</h4>
                   <p className="text-sm text-gray-600 mt-1">Connect with external APIs and services</p>
                 </div>
               </div>
               
               <div className="flex items-start space-x-3">
                 <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                   <Zap className="h-5 w-5" />
                 </div>
                 <div>
                   <h4 className="font-medium text-gray-900">Conditional Logic</h4>
                   <p className="text-sm text-gray-600 mt-1">Create complex decision trees and branching</p>
                 </div>
               </div>
               
               <div className="flex items-start space-x-3">
                 <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                   <Bot className="h-5 w-5" />
                 </div>
                 <div>
                   <h4 className="font-medium text-gray-900">Multi-Node Support</h4>
                   <p className="text-sm text-gray-600 mt-1">Message, input, pause, and condition nodes</p>
                 </div>
               </div>
             </div>
           </CardContent>
         </Card>
      </main>
    </div>
  )
}
