'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  TrendingUp, 
  TrendingDown, 
  MessageSquare, 
  Users, 
  Clock, 
  ArrowUpRight, 
  Calendar, 
  BarChart3, 
  Download,
  Activity,
  UserCheck,
  MousePointer,
  Target,
  RefreshCw
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

interface AnalyticsData {
  period: string;
  conversations: Array<{
    date: string;
    count: number;
    resolved: number;
    handovers: number;
    avgMessages: number;
  }>;
  performance: {
    totalConversations: number;
    totalSessions: number;
    totalInteractions: number;
    uniqueUsers: number;
    activeUsers: number;
    activeConversations: number;
    resolutionRate: number;
    averageResponseTime: number;
    customerSatisfaction: number;
    handoverRate: number;
    avgMessagesPerConversation: number;
    averageInteractionsPerUser: number;
  };
  userEngagement: {
    totalUsers: number;
    returningUsers: number;
    newUsers: number;
    averageSessionDuration: number;
    peakHours: Array<{
      hour: number;
      conversations: number;
      users: number;
    }>;
  };
  topQuestions: Array<{
    question: string;
    count: number;
    percentage: number;
    avgResponseTime: number;
  }>;
}

interface Bot {
  _id: string;
  name: string;
  metrics: {
    totalConversations: number;
    totalSessions: number;
    totalInteractions: number;
    uniqueUsers: number;
    activeUsers: number;
    newMessages24h: number;
    averageResponseTime: number;
    handoverRate: number;
    averageInteractionsPerUser: number;
  };
}

export default function AnalyticsPage() {
  const params = useParams()
  const [bot, setBot] = useState<Bot | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'custom'>('week')
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    fetchBot()
    fetchAnalytics()
  }, [params.id, period, startDate, endDate])

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
    }
  }

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      let url = `/api/bots/${params.id}/analytics?period=${period}`
      
      if (period === 'custom') {
        url += `&startDate=${startDate}&endDate=${endDate}`
      }

      const response = await fetch(url)
      const result = await response.json()

      if (response.ok) {
        setAnalytics(result.analytics)
      } else {
        setError(result.error || 'Failed to fetch analytics')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const exportData = async (format: 'json' | 'csv') => {
    try {
      setIsExporting(true)
      const response = await fetch(`/api/bots/${params.id}/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'export',
          format,
          period,
          startDate: period === 'custom' ? startDate : undefined,
          endDate: period === 'custom' ? endDate : undefined,
        }),
      })

      if (response.ok) {
        if (format === 'csv') {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `bot-analytics-${params.id}-${period}.csv`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        } else {
          const data = await response.json()
          const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `bot-analytics-${params.id}-${period}.json`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
      }
    } catch (err) {
      setError('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const getPeriodLabel = () => {
    switch (period) {
      case 'day': return 'Yesterday'
      case 'week': return 'Last week'
      case 'month': return 'Last month'
      case 'custom': return `${startDate} to ${endDate}`
      default: return 'Last week'
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Analytics</h1>
        </header>
        <main className="flex-1 p-6 min-h-0">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading analytics...
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !bot) {
    return (
      <div className="flex flex-col h-full">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Analytics</h1>
        </header>
        <main className="flex-1 p-6 min-h-0">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">{error || 'Bot not found'}</div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Analytics</h1>
          <div className="flex items-center space-x-3">
            {/* Period Selector */}
            <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Yesterday</SelectItem>
                <SelectItem value="week">Last week</SelectItem>
                <SelectItem value="month">Last month</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>

            {/* Custom Date Range */}
            {period === 'custom' && (
              <div className="flex items-center space-x-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-32"
                />
                <span className="text-gray-500">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-32"
                />
              </div>
            )}

            {/* Export Buttons */}
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportData('csv')}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportData('json')}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 min-h-0">
        {(!analytics || analytics.performance.totalConversations === 0) ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center">
            <BarChart3 className="h-24 w-24 text-gray-400 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
              No Analytics Data Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
              Once your bot starts receiving messages, you'll see detailed analytics here including 
              conversation trends, response times, and user engagement metrics.
            </p>
            <div className="space-y-4">
              <Link href={`/dashboard/bots/${params.id}/embed`}>
                <Button>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Get Embed Code
                </Button>
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add the chat widget to your website to start collecting data
              </p>
            </div>
          </div>
        ) : (
          /* Analytics Content */
          <div className="space-y-8">
            {/* Period Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Analytics Period
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {getPeriodLabel()}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    All metrics are calculated from actual conversation data in the selected period
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchAnalytics}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.performance.totalConversations}</div>
                  <p className="text-xs text-muted-foreground">
                    All conversations in period
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.performance.totalSessions}</div>
                  <p className="text-xs text-muted-foreground">
                    Unique user sessions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.performance.uniqueUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    Distinct users engaged
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.performance.activeUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    Users in selected period
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Second Row of Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.performance.totalInteractions}</div>
                  <p className="text-xs text-muted-foreground">
                    All messages exchanged
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Interactions/User</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.performance.averageInteractionsPerUser}</div>
                  <p className="text-xs text-muted-foreground">
                    Average per user
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.performance.averageResponseTime > 0 ? `${analytics.performance.averageResponseTime}s` : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average response time
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Handover Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.performance.handoverRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    Human takeover rate
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Conversation Trends</CardTitle>
                  <CardDescription>Daily conversation volume over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">Chart coming soon</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {analytics.conversations.length} data points available
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top User Questions</CardTitle>
                  <CardDescription>Most frequently asked questions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.topQuestions.slice(0, 5).map((question, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{question.question}</p>
                          <p className="text-xs text-gray-500">{question.count} times</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{question.percentage.toFixed(1)}%</p>
                          <p className="text-xs text-gray-500">{question.avgResponseTime}s avg</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
                <CardDescription>
                  Key metrics and insights about your bot's performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">Resolution Rate</h4>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {analytics.performance.resolutionRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Conversations resolved successfully
                    </p>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 text-green-900 dark:text-green-100">User Engagement</h4>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {analytics.performance.avgMessagesPerConversation.toFixed(1)}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Avg messages per conversation
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 text-purple-900 dark:text-purple-100">Active Conversations</h4>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {analytics.performance.activeConversations}
                    </p>
                    <p className="text-sm text-purple-600 dark:text-purple-400">
                      Currently active conversations
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
} 