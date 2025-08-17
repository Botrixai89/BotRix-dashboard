'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, TrendingUp, Clock, Users, ArrowUpRight, Bot, Settings, Code, BarChart3, TestTube, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loading } from '@/components/ui/loading'

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
      <div className="flex items-center justify-center h-full">
        <Loading size="lg" text="Loading bot..." />
      </div>
    )
  }

  if (error || !bot) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="p-4 rounded-full bg-red-100 text-red-600 mb-4 inline-block">
            <Bot className="h-8 w-8" />
          </div>
          <div className="text-red-600 font-medium">{error || 'Bot not found'}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-gray-50 min-h-full overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Overview Header */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Overview</h1>
        </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
        <Button 
          variant="outline" 
          className="w-full sm:w-auto border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 px-4 rounded-lg font-medium min-h-[44px]"
          onClick={testBotConfiguration}
          disabled={isTestingBot}
        >
          <TestTube className="mr-2 h-4 w-4" />
          {isTestingBot ? 'Testing...' : 'Test Configuration'}
        </Button>
        <Button 
          variant="outline" 
          className="w-full sm:w-auto border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 px-4 rounded-lg font-medium min-h-[44px]"
          onClick={() => window.open(`/test-widget.html?botId=${params.id}`, '_blank')}
        >
          <Eye className="mr-2 h-4 w-4" />
          Test Widget
        </Button>
        <Link href={`/dashboard/bots/${params.id}/builder`} className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 px-4 rounded-lg font-medium min-h-[44px]">
            <Settings className="mr-2 h-4 w-4" />
            Edit Bot
          </Button>
        </Link>
        <Link href={`/dashboard/bots/${params.id}/messages`} className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-blue-600 text-white border-0 hover:bg-blue-700 py-2.5 px-4 rounded-lg font-medium min-h-[44px]">
            <MessageSquare className="mr-2 h-4 w-4" />
            View Messages
          </Button>
        </Link>
      </div>

      {/* Test Results */}
      {testResult && (
        <Card className="border border-gray-200 shadow-sm bg-white">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Total Conversations</CardTitle>
            <div className="w-8 h-8 sm:w-6 sm:h-6 bg-blue-100 text-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-4 w-4 sm:h-3 sm:w-3" />
            </div>
          </CardHeader>
          <CardContent className="pt-2 px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-2xl sm:text-xl font-bold text-gray-900">{bot.metrics.totalConversations}</div>
            <p className="text-sm sm:text-xs text-gray-500 mt-1">
              {bot.metrics.totalConversations > 0 ? 'Active conversations' : 'Start your first conversation!'}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">New Messages (24h)</CardTitle>
            <div className="w-8 h-8 sm:w-6 sm:h-6 bg-green-100 text-green-600 rounded-md flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-4 w-4 sm:h-3 sm:w-3" />
            </div>
          </CardHeader>
          <CardContent className="pt-2 px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-2xl sm:text-xl font-bold text-gray-900">{bot.metrics.newMessages24h}</div>
            <p className="text-sm sm:text-xs text-gray-500 mt-1">
              {bot.metrics.newMessages24h > 0 ? 'Recent activity' : 'No messages today'}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Avg. Response Time</CardTitle>
            <div className="w-8 h-8 sm:w-6 sm:h-6 bg-orange-100 text-orange-600 rounded-md flex items-center justify-center flex-shrink-0">
              <Clock className="h-4 w-4 sm:h-3 sm:w-3" />
            </div>
          </CardHeader>
          <CardContent className="pt-2 px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-2xl sm:text-xl font-bold text-gray-900">
              {bot.metrics.averageResponseTime > 0 ? `${bot.metrics.averageResponseTime}s` : 'N/A'}
            </div>
            <p className="text-sm sm:text-xs text-gray-500 mt-1">
              {bot.metrics.averageResponseTime > 0 ? 'Response performance' : 'No data yet'}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-sm font-medium text-gray-700">Handover Rate</CardTitle>
            <div className="w-8 h-8 sm:w-6 sm:h-6 bg-purple-100 text-purple-600 rounded-md flex items-center justify-center flex-shrink-0">
              <Users className="h-4 w-4 sm:h-3 sm:w-3" />
            </div>
          </CardHeader>
          <CardContent className="pt-2 px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-2xl sm:text-xl font-bold text-gray-900">
              {bot.metrics.handoverRate > 0 ? `${bot.metrics.handoverRate}%` : '0%'}
            </div>
            <p className="text-sm sm:text-xs text-gray-500 mt-1">
              {bot.metrics.handoverRate > 0 ? 'Human intervention' : 'No handovers yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Section */}
      {bot.metrics.totalConversations === 0 ? (
        <Card className="border border-gray-200 shadow-sm bg-white rounded-xl">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl font-semibold">Getting Started</CardTitle>
            <CardDescription className="text-gray-600 text-sm sm:text-base">
              As easy as 1-2-3
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 border border-gray-200 rounded-lg">
                <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  ✓
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm sm:text-base">Create a bot</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 border border-gray-200 rounded-lg">
                <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  ✓
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm sm:text-base">Build conversational flows</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 border border-gray-200 rounded-lg">
                <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  ✓
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm sm:text-base">Train the bot</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 border border-gray-200 rounded-lg bg-blue-50">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  ✓
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm sm:text-base">Deploy the bot</div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">
                    Finally, lets do this - Configure and deploy the bot across multiple channels
                  </div>
                  <div className="mt-3">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-medium min-h-[44px] w-full sm:w-auto">
                      Deploy
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Recent Activity */
        <Card className="border border-gray-200 shadow-sm bg-white rounded-xl">
          <CardHeader className="px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div>
                <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
                <CardDescription className="text-gray-600 text-sm sm:text-base">Latest interactions with your bot</CardDescription>
              </div>
              <Link href={`/dashboard/bots/${params.id}/messages`}>
                <Button variant="ghost" size="sm" className="hover:bg-gray-50 text-gray-600 py-2 px-3 rounded-lg min-h-[40px]">
                  View All
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="text-center py-8 sm:py-12">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <p className="text-gray-500 text-base sm:text-lg px-4">Conversation history will appear here once you start receiving messages.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Cards Section - Like AI Life Bot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
        {/* Live Chat Card */}
        <Card className="border border-gray-200 shadow-sm bg-white rounded-xl">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl font-semibold">Live Chat</CardTitle>
            <CardDescription className="text-gray-600 text-sm sm:text-base">
              Connect with your customers in real-time across multiple channels. Respond to incoming conversations across channels leveraging the One-
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="text-center py-6 sm:py-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <p className="text-gray-500 text-sm sm:text-base mb-4">Real-time customer conversations</p>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Card */}
        <Card className="border border-gray-200 shadow-sm bg-white rounded-xl">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl font-semibold">Analytics</CardTitle>
            <CardDescription className="text-gray-600 text-sm sm:text-base">
              View, monitor bot and team performance. Track engagement and retention across multiple channels over time
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="text-center py-6 sm:py-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <p className="text-gray-500 text-sm sm:text-base mb-4">Performance insights and metrics</p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
} 