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
  RefreshCw,
  Eye,
  Star,
  Headphones,
  CheckCircle,
  ArrowLeft,
  TrendingUp as TrendingUpDown,
  BarChart,
  PieChart,
  LineChart
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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

function AnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const [bot, setBot] = useState<Bot | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'custom'>('custom')
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [isExporting, setIsExporting] = useState(false)
  const [viewMode, setViewMode] = useState<'detailed' | 'overview'>('detailed')
  const [selectedMetric, setSelectedMetric] = useState<'engagement' | 'responses' | 'retention' | 'all'>('all')

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

  const exportData = async () => {
    try {
      setIsExporting(true)
      
      // Use GET request with format parameter for proper CSV export
      let url = `/api/bots/${params.id}/analytics?format=csv&period=${period}`
      
      if (period === 'custom') {
        url += `&startDate=${startDate}&endDate=${endDate}`
      }

      const response = await fetch(url)

      if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
        a.download = `${bot?.name || 'bot'}-analytics-${period}-${format(new Date(), 'yyyy-MM-dd')}.csv`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        } else {
        const result = await response.json()
        setError(result.error || 'Failed to export data')
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

  const shouldShowSection = (sectionType: 'engagement' | 'responses' | 'retention') => {
    return selectedMetric === 'all' || selectedMetric === sectionType
  }

  const getDisplayMode = () => {
    return viewMode === 'detailed' ? 'detailed' : 'overview'
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
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 pt-4 pb-[0.5rem] flex-shrink-0">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">Analytics</h1>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            {/* Period Selector */}
            <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
              <SelectTrigger className="w-full sm:w-40">
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
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full sm:w-32"
                />
                <span className="text-gray-500 text-center sm:text-left">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full sm:w-32"
                />
              </div>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Metric Filter */}
              <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Metrics</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="responses">Responses</SelectItem>
                  <SelectItem value="retention">Retention</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export Button - Only CSV */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportData}
              disabled={isExporting}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'CSV'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
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
          <div className="space-y-6">
            {/* Get Started Section */}
            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Get Started</CardTitle>
                    <CardDescription className="text-gray-600">
                      View, monitor bot and team performance. Track engagement and retention across multiple channels over time
                    </CardDescription>
                </div>
                <Button variant="default" size="sm" onClick={fetchAnalytics} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Track bot engagement
                </Button>
              </div>
              </CardHeader>
            </Card>

            {/* Key Insights Summary */}
            <Card className="border border-gray-200 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Target className="h-5 w-5 mr-2 text-indigo-600" />
                  Key Insights & Trends
                </CardTitle>
                <CardDescription>
                  AI-powered insights based on your bot's performance in {getPeriodLabel().toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Engagement Insight */}
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">User Engagement</h4>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        analytics.performance.averageInteractionsPerUser >= 3 
                          ? 'bg-green-100 text-green-700' 
                          : analytics.performance.averageInteractionsPerUser >= 2
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {analytics.performance.averageInteractionsPerUser >= 3 ? 'High' : 
                         analytics.performance.averageInteractionsPerUser >= 2 ? 'Medium' : 'Low'}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {analytics.performance.averageInteractionsPerUser >= 3 
                        ? `Excellent! Users are highly engaged with ${analytics.performance.averageInteractionsPerUser.toFixed(1)} interactions per user.`
                        : analytics.performance.averageInteractionsPerUser >= 2
                        ? `Good engagement level. Consider optimizing responses to increase interaction quality.`
                        : `Low engagement detected. Focus on improving bot responses and user experience.`
                      }
                    </p>
                  </div>

                  {/* Response Quality Insight */}
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Response Quality</h4>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        analytics.performance.resolutionRate >= 80 
                          ? 'bg-green-100 text-green-700' 
                          : analytics.performance.resolutionRate >= 60
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {analytics.performance.resolutionRate >= 80 ? 'Excellent' : 
                         analytics.performance.resolutionRate >= 60 ? 'Good' : 'Needs Work'}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {analytics.performance.resolutionRate >= 80 
                        ? `Outstanding ${analytics.performance.resolutionRate.toFixed(1)}% resolution rate. Your bot is performing excellently!`
                        : analytics.performance.resolutionRate >= 60
                        ? `Solid ${analytics.performance.resolutionRate.toFixed(1)}% resolution rate. Room for improvement in knowledge base.`
                        : `${analytics.performance.resolutionRate.toFixed(1)}% resolution rate needs attention. Consider expanding bot training.`
                      }
                    </p>
                  </div>

                  {/* User Retention Insight */}
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">User Retention</h4>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        analytics.userEngagement.totalUsers > 0 && 
                        (analytics.userEngagement.returningUsers / analytics.userEngagement.totalUsers) >= 0.3
                          ? 'bg-green-100 text-green-700' 
                          : (analytics.userEngagement.returningUsers / analytics.userEngagement.totalUsers) >= 0.15
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {analytics.userEngagement.totalUsers > 0 && 
                         (analytics.userEngagement.returningUsers / analytics.userEngagement.totalUsers) >= 0.3 ? 'High' : 
                         (analytics.userEngagement.returningUsers / analytics.userEngagement.totalUsers) >= 0.15 ? 'Medium' : 'Low'}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {analytics.userEngagement.totalUsers > 0 ? (
                        (analytics.userEngagement.returningUsers / analytics.userEngagement.totalUsers) >= 0.3 
                          ? `Great retention! ${((analytics.userEngagement.returningUsers / analytics.userEngagement.totalUsers) * 100).toFixed(1)}% of users return.`
                          : (analytics.userEngagement.returningUsers / analytics.userEngagement.totalUsers) >= 0.15
                          ? `Moderate retention at ${((analytics.userEngagement.returningUsers / analytics.userEngagement.totalUsers) * 100).toFixed(1)}%. Focus on user experience.`
                          : `Low retention rate of ${((analytics.userEngagement.returningUsers / analytics.userEngagement.totalUsers) * 100).toFixed(1)}%. Improve first interaction quality.`
                      ) : (
                        'No retention data available yet. Continue engaging users to build insights.'
                      )}
                    </p>
                  </div>
                </div>

                {/* Action Recommendations */}
                <div className="mt-6 p-4 bg-white rounded-lg border-l-4 border-indigo-500">
                  <h4 className="font-medium text-gray-900 mb-2">💡 Recommended Actions</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {analytics.performance.averageInteractionsPerUser < 2 && (
                      <li>• Enhance bot responses with more engaging content and follow-up questions</li>
                    )}
                    {analytics.performance.resolutionRate < 70 && (
                      <li>• Expand your bot's knowledge base to handle more user queries</li>
                    )}
                    {analytics.performance.handoverRate > 20 && (
                      <li>• Review high handover conversations to identify knowledge gaps</li>
                    )}
                    {analytics.userEngagement.totalUsers > 0 && 
                     (analytics.userEngagement.returningUsers / analytics.userEngagement.totalUsers) < 0.2 && (
                      <li>• Improve first-time user experience to encourage return visits</li>
                    )}
                    {analytics.performance.averageResponseTime > 5 && (
                      <li>• Optimize bot response time for better user experience</li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Overview Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Total Conversations</CardTitle>
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-md flex items-center justify-center">
                    <MessageSquare className="h-3 w-3" />
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="text-xl font-bold text-gray-900">{analytics.performance.totalConversations}</div>
                  <p className="text-xs text-gray-500 mt-1">
                      All conversations in {getPeriodLabel().toLowerCase()}
                  </p>
                </CardContent>
              </Card>

                <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Unique Users</CardTitle>
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-md flex items-center justify-center">
                    <Users className="h-3 w-3" />
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="text-xl font-bold text-gray-900">{analytics.performance.uniqueUsers}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Distinct users engaged
                  </p>
                </CardContent>
              </Card>

                <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">Avg Response Time</CardTitle>
                    <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-md flex items-center justify-center">
                      <Clock className="h-3 w-3" />
                    </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="text-xl font-bold text-gray-900">
                    {analytics.performance.averageResponseTime > 0 ? `${analytics.performance.averageResponseTime}s` : 'N/A'}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Average response time
                  </p>
                </CardContent>
              </Card>

                <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">Resolution Rate</CardTitle>
                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-md flex items-center justify-center">
                      <CheckCircle className="h-3 w-3" />
                    </div>
                </CardHeader>
                <CardContent className="pt-2">
                    <div className="text-xl font-bold text-gray-900">{analytics.performance.resolutionRate.toFixed(1)}%</div>
                  <p className="text-xs text-gray-500 mt-1">
                      Conversations resolved
                  </p>
                </CardContent>
              </Card>
              </div>
            </div>

            {/* Enhanced Bot Engagement Section */}
            {shouldShowSection('engagement') && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Bot Engagement</h2>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {analytics.performance.activeUsers} Active Users
                </Badge>
              </div>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">Active users</CardTitle>
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-md flex items-center justify-center">
                      <Users className="h-3 w-3" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="text-2xl font-bold text-gray-900">{analytics.performance.activeUsers}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      Users active in {getPeriodLabel().toLowerCase()}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">Total interactions</CardTitle>
                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-md flex items-center justify-center">
                      <MessageSquare className="h-3 w-3" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="text-2xl font-bold text-gray-900">{analytics.performance.totalInteractions}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      All user interactions
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">Average interactions per user</CardTitle>
                    <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-md flex items-center justify-center">
                      <TrendingUp className="h-3 w-3" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="text-2xl font-bold text-gray-900">{analytics.performance.averageInteractionsPerUser.toFixed(1)}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      Interactions per user
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">Session Duration</CardTitle>
                    <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-md flex items-center justify-center">
                      <Clock className="h-3 w-3" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="text-2xl font-bold text-gray-900">
                      {analytics.userEngagement.averageSessionDuration > 0 
                        ? Math.round(analytics.userEngagement.averageSessionDuration / 60) + 'm' 
                        : 'N/A'
                      }
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Average session length
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* New Users vs Active Users Chart */}
              <Card className="border border-gray-200 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                    New Users vs Active Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No Data Available</p>
                      <p className="text-xs text-gray-400 mt-1">Chart will display when data is available</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Button Actions */}
              <Card className="border border-gray-200 shadow-sm bg-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <MousePointer className="h-5 w-5 mr-2 text-green-600" />
                      Button Actions
                    </CardTitle>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input type="radio" name="view" value="grouped" defaultChecked className="text-orange-500" />
                        <span className="text-sm text-gray-600">Grouped</span>
                      </label>
                      <span className="text-sm text-gray-600">Stacked</span>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">Clicks</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="w-full">
                      <div className="bg-purple-400 h-12 rounded mb-2 flex items-center justify-center">
                        <span className="text-white text-sm">No, let's</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 h-8">
                        {Array.from({length: 12}).map((_, i) => (
                          <div key={i} className="bg-gray-200 rounded"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            )}

            {/* Enhanced Bot Responses Section */}
            {shouldShowSection('responses') && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Bot Responses</h2>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {analytics.performance.resolutionRate.toFixed(1)}% Resolution Rate
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Response Performance */}
                <Card className="border border-gray-200 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
                      Response Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Response Time</div>
                        <div className="text-xl font-bold text-gray-900">
                          {analytics.performance.averageResponseTime > 0 
                            ? `${analytics.performance.averageResponseTime}s` 
                            : 'N/A'
                          }
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Success Rate</div>
                        <div className="text-xl font-bold text-green-600">
                          {(100 - analytics.performance.handoverRate).toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Active Conversations</div>
                        <div className="text-xl font-bold text-blue-600">
                          {analytics.performance.activeConversations}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Resolution Rate</div>
                        <div className="text-xl font-bold text-purple-600">
                          {analytics.performance.resolutionRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Response Quality */}
                <Card className="border border-gray-200 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Star className="h-5 w-5 mr-2 text-yellow-600" />
                      Response Quality
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Customer Satisfaction</span>
                        <span className="font-semibold text-green-600">
                          {analytics.performance.customerSatisfaction.toFixed(1)}/5.0
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${(analytics.performance.customerSatisfaction / 5) * 100}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-gray-600">Handover Rate</span>
                        <span className="font-semibold text-orange-600">
                          {analytics.performance.handoverRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full" 
                          style={{ width: `${analytics.performance.handoverRate}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-gray-600">Messages per Conversation</span>
                        <span className="font-semibold text-blue-600">
                          {analytics.performance.avgMessagesPerConversation.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            )}

            {/* Enhanced User Retention Analysis */}
            {shouldShowSection('retention') && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">User Retention Analysis</h2>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  {analytics.userEngagement.totalUsers > 0 
                    ? ((analytics.userEngagement.returningUsers / analytics.userEngagement.totalUsers) * 100).toFixed(1)
                    : 0
                  }% Return Rate
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Breakdown */}
                <Card className="border border-gray-200 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Users className="h-5 w-5 mr-2 text-purple-600" />
                      User Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {analytics.userEngagement.newUsers}
                        </div>
                        <div className="text-sm text-gray-600">New Users</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {analytics.userEngagement.totalUsers > 0 
                            ? ((analytics.userEngagement.newUsers / analytics.userEngagement.totalUsers) * 100).toFixed(1)
                            : 0
                          }% of total
                        </div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {analytics.userEngagement.returningUsers}
                        </div>
                        <div className="text-sm text-gray-600">Returning Users</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {analytics.userEngagement.totalUsers > 0 
                            ? ((analytics.userEngagement.returningUsers / analytics.userEngagement.totalUsers) * 100).toFixed(1)
                            : 0
                          }% of total
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Total Users</span>
                        <span className="font-semibold">{analytics.userEngagement.totalUsers}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="flex h-3 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-500" 
                            style={{ 
                              width: analytics.userEngagement.totalUsers > 0 
                                ? `${(analytics.userEngagement.newUsers / analytics.userEngagement.totalUsers) * 100}%`
                                : '0%'
                            }}
                          ></div>
                          <div 
                            className="bg-green-500" 
                            style={{ 
                              width: analytics.userEngagement.totalUsers > 0 
                                ? `${(analytics.userEngagement.returningUsers / analytics.userEngagement.totalUsers) * 100}%`
                                : '0%'
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>New</span>
                        <span>Returning</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Engagement Metrics */}
                <Card className="border border-gray-200 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
                      Engagement Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="text-sm text-gray-600">Avg Interactions per User</div>
                          <div className="text-lg font-bold text-gray-900">
                            {analytics.performance.averageInteractionsPerUser.toFixed(1)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Per session</div>
                          <div className="text-sm font-semibold text-blue-600">
                            {analytics.performance.totalSessions > 0 
                              ? (analytics.performance.totalInteractions / analytics.performance.totalSessions).toFixed(1)
                              : 'N/A'
                            }
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="text-sm text-gray-600">Session Duration</div>
                          <div className="text-lg font-bold text-gray-900">
                            {analytics.userEngagement.averageSessionDuration > 0 
                              ? Math.round(analytics.userEngagement.averageSessionDuration / 60) + ' min'
                              : 'N/A'
                            }
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Average</div>
                          <div className="text-sm font-semibold text-green-600">
                            {analytics.userEngagement.averageSessionDuration > 0 
                              ? Math.round(analytics.userEngagement.averageSessionDuration) + 's'
                              : 'N/A'
                            }
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="text-sm text-gray-600">Return Rate</div>
                          <div className="text-lg font-bold text-gray-900">
                            {analytics.userEngagement.totalUsers > 0 
                              ? ((analytics.userEngagement.returningUsers / analytics.userEngagement.totalUsers) * 100).toFixed(1)
                              : 0
                            }%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Retention</div>
                          <div className="text-sm font-semibold text-purple-600">
                            {analytics.userEngagement.returningUsers > 0 ? 'Good' : 'Low'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Peak Usage Hours */}
              <Card className="border border-gray-200 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-indigo-600" />
                    Peak Usage Hours
                  </CardTitle>
                  <CardDescription>
                    Times when users are most active with your bot
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Peak hours analysis</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {analytics.userEngagement.peakHours.length > 0 
                          ? `${analytics.userEngagement.peakHours.length} hours tracked`
                          : 'No peak hour data available'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            )}

            {/* Support Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Support</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Live Chat Summary */}
                <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                      Live chat summary
                    </CardTitle>
                    <CardDescription>
                      Monitor human-assisted engagement in real-time across multiple channels. View multiple chats, data points, and take actions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Most Asked Questions</span>
                          </div>
                          <div className="space-y-2">
                            {analytics.topQuestions.slice(0, 3).map((question, index) => (
                              <div key={index} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{question.question}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-500">{question.count} times</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        View summary
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Agents Performance */}
                <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Users className="h-5 w-5 mr-2 text-green-600" />
                      Agents
                    </CardTitle>
                    <CardDescription>
                      Track productivity at an agent level. View requests managed, SLA adherence, time to service across all agents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Human Handovers</span>
                            <span className="font-semibold">{analytics.performance.handoverRate.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</span>
                            <span className="font-semibold">
                              {analytics.performance.averageResponseTime > 0 ? `${analytics.performance.averageResponseTime}s` : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Resolution Rate</span>
                            <span className="font-semibold">{analytics.performance.resolutionRate.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full">
                        <Headphones className="h-4 w-4 mr-2" />
                        Track Agents
                      </Button>
                  </div>
                </CardContent>
              </Card>
              </div>
            </div>

            {/* Track with Analytics Section */}
            <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <BarChart className="h-5 w-5 mr-2 text-purple-600" />
                  Track with Analytics
                </CardTitle>
                <CardDescription>
                  Get detailed insights into your bot performance and user engagement patterns over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="text-center p-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <LineChart className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="font-medium mb-2">Conversation Trends</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Monitor daily conversation volume and patterns over {getPeriodLabel().toLowerCase()}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {analytics.conversations.length} data points available
                    </p>
                  </div>
                  
                  <div className="text-center p-4">
                    <div className="bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <h4 className="font-medium mb-2">User Engagement</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Track user retention, new vs returning users, and engagement metrics
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {analytics.userEngagement.totalUsers} total users tracked
                    </p>
                  </div>
                  
                  <div className="text-center p-4">
                    <div className="bg-purple-100 dark:bg-purple-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <PieChart className="h-6 w-6 text-purple-600" />
                    </div>
                    <h4 className="font-medium mb-2">Performance Metrics</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Response times, resolution rates, and bot efficiency analytics
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {analytics.performance.resolutionRate.toFixed(1)}% resolution rate
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

export default AnalyticsPage 