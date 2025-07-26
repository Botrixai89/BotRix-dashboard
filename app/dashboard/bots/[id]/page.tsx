'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, TrendingUp, Clock, Users, ArrowUpRight, Bot, Settings, Code, BarChart3, TestTube, AlertTriangle, CheckCircle, XCircle, Eye, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface Bot {
  _id: string;
  name: string;
  status: string;
  metrics: {
    totalConversations: number;
    newMessages24h: number;
    averageResponseTime: number;
    handoverRate: number;
  };
  companyLogo?: string; // Added for company logo
}

interface TestResult {
  bot: {
    id: string;
    name: string;
    status: string;
    settings: {
      webhookUrl: string;
      welcomeMessage: string;
      fallbackMessage: string;
      primaryColor: string;
    };
  };
  webhookTest: {
    status: string;
    message: string;
    statusCode?: number;
    response?: any;
    error?: string;
  };
  recommendations: string[];
}

export default function BotOverviewPage() {
  const params = useParams()
  const [bot, setBot] = useState<Bot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isTestingBot, setIsTestingBot] = useState(false)

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

  const testBotConfiguration = async () => {
    setIsTestingBot(true)
    try {
      const response = await fetch(`/api/bots/${params.id}/test`)
      const result = await response.json()
      
      if (response.ok) {
        setTestResult(result)
      } else {
        setError(result.error || 'Failed to test bot')
      }
    } catch (err) {
      setError('Failed to test bot configuration')
    } finally {
      setIsTestingBot(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-8 py-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
        </header>
        <main className="flex-1 overflow-auto p-8">
          <div className="flex items-center justify-center h-64">
            <div className="p-4 rounded-full bg-teal-600">
              <Bot className="h-8 w-8 text-white animate-pulse" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !bot) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-8 py-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
        </header>
        <main className="flex-1 overflow-auto p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="p-4 rounded-full bg-red-100 text-red-600 mb-4 inline-block">
                <Bot className="h-8 w-8" />
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
      {/* Bot Info Section at the top of main content */}
      <div className="flex items-center px-8 py-4 border-b border-gray-200 bg-white" style={{minHeight: '80px'}}>
        {bot.companyLogo ? (
          <img 
            src={bot.companyLogo} 
            alt="Company Logo" 
            className="object-cover border border-gray-200 w-10 h-10 rounded-lg" 
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center border border-gray-200">
            <Bot className="h-5 w-5 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0 ml-3">
          <h2 className="font-bold text-lg text-gray-900 truncate">{bot.name}</h2>
          {bot.status === 'active' && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">active</span>
          )}
          {bot.status === 'inactive' && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded">inactive</span>
          )}
        </div>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="hover:bg-teal-50 text-teal-600 p-2 ml-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              className="border-orange-200 text-orange-600 hover:bg-orange-50"
              onClick={testBotConfiguration}
              disabled={isTestingBot}
            >
              <TestTube className="mr-2 h-4 w-4" />
              {isTestingBot ? 'Testing...' : 'Test Configuration'}
            </Button>
            <Button 
              variant="outline" 
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
              onClick={() => window.open(`/test-widget.html?botId=${params.id}`, '_blank')}
            >
              <Eye className="mr-2 h-4 w-4" />
              Test Widget
            </Button>
            <Link href={`/dashboard/bots/${params.id}/builder`}>
              <Button variant="outline" className="border-teal-200 text-teal-600 hover:bg-teal-50">
                <Settings className="mr-2 h-4 w-4" />
                Edit Bot
              </Button>
            </Link>
            <Link href={`/dashboard/bots/${params.id}/messages`}>
              <Button className="bg-teal-600 text-white border-0 hover:bg-teal-700">
                <MessageSquare className="mr-2 h-4 w-4" />
                View Messages
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-8 space-y-8">
        {/* Test Results */}
        {testResult && (
          <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  testResult.webhookTest.status === 'success' ? 'bg-green-500' :
                  testResult.webhookTest.status === 'demo_mode' ? 'bg-yellow-500' :
                  'bg-red-500'
                } text-white`}>
                  {testResult.webhookTest.status === 'success' ? <CheckCircle className="h-5 w-5" /> :
                   testResult.webhookTest.status === 'demo_mode' ? <AlertTriangle className="h-5 w-5" /> :
                   <XCircle className="h-5 w-5" />}
                </div>
                <div>
                  <CardTitle className="text-xl">Bot Configuration Test</CardTitle>
                  <CardDescription className="text-gray-600">
                    {testResult.webhookTest.message}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Bot Settings:</h4>
                    <div className="text-sm space-y-1">
                      <div><span className="font-medium">Status:</span> {testResult.bot.status}</div>
                      <div><span className="font-medium">Webhook URL:</span> 
                        <span className="text-xs break-all">{testResult.bot.settings.webhookUrl}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Webhook Test:</h4>
                    <div className="text-sm space-y-1">
                      <div><span className="font-medium">Status:</span> {testResult.webhookTest.status}</div>
                      {testResult.webhookTest.statusCode && (
                        <div><span className="font-medium">HTTP Status:</span> {testResult.webhookTest.statusCode}</div>
                      )}
                      {testResult.webhookTest.error && (
                        <div className="text-red-600"><span className="font-medium">Error:</span> {testResult.webhookTest.error}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Recommendations:</h4>
                  <ul className="space-y-1">
                    {testResult.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </div>

                {testResult.webhookTest.response && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Webhook Response:</h4>
                    <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-x-auto">
                      {JSON.stringify(testResult.webhookTest.response, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-sm card-glow bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Total Conversations</CardTitle>
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">{bot.metrics.totalConversations}</div>
              <p className="text-xs text-gray-600">
                {bot.metrics.totalConversations > 0 ? '+0% from last month' : 'Start your first conversation!'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm card-glow bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">New Messages (24h)</CardTitle>
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">{bot.metrics.newMessages24h}</div>
              <p className="text-xs text-gray-600">
                {bot.metrics.newMessages24h > 0 ? '+0% from yesterday' : 'No messages today'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm card-glow bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Avg. Response Time</CardTitle>
              <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {bot.metrics.averageResponseTime > 0 ? `${bot.metrics.averageResponseTime}s` : 'N/A'}
              </div>
              <p className="text-xs text-gray-600">
                {bot.metrics.averageResponseTime > 0 ? 'Based on recent activity' : 'No data yet'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm card-glow bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Handover Rate</CardTitle>
              <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {bot.metrics.handoverRate > 0 ? `${bot.metrics.handoverRate}%` : '0%'}
              </div>
              <p className="text-xs text-gray-600">
                {bot.metrics.handoverRate > 0 ? 'Human takeover rate' : 'No handovers yet'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started or Recent Activity */}
        {bot.metrics.totalConversations === 0 ? (
          /* Getting Started */
          <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-teal-600">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Get Started with Your Bot</CardTitle>
                  <CardDescription className="text-gray-600">
                    Your bot "{bot.name}" is ready! Here's how to start getting conversations:
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Link href={`/dashboard/bots/${params.id}/embed`}>
                    <Card className="cursor-pointer hover-lift border-0 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-all">
                      <CardHeader className="pb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center">
                            <Code className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Get Embed Code</CardTitle>
                            <CardDescription>
                              Copy the embed code and add it to your website
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>

                  <Link href={`/dashboard/bots/${params.id}/builder`}>
                    <Card className="cursor-pointer hover-lift border-0 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all">
                      <CardHeader className="pb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-500 text-white rounded-lg flex items-center justify-center">
                            <Settings className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Configure Responses</CardTitle>
                            <CardDescription>
                              Set up your bot's responses and conversation flows
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">
                        Webhook Integration Ready
                      </h4>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        Your bot is connected to your automation workflow. All messages will be processed 
                        through your configured webhook for intelligent responses. Start conversations to see 
                        your automation in action!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Recent Activity */
          <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Recent Activity</CardTitle>
                  <CardDescription className="text-gray-600">Latest interactions with your bot</CardDescription>
                </div>
                <Link href={`/dashboard/bots/${params.id}/messages`}>
                  <Button variant="ghost" size="sm" className="hover:bg-purple-50 text-purple-600">
                    View All
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <p className="text-gray-500 text-lg">Conversation history will appear here once you start receiving messages.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
} 