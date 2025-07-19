'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, MessageSquare, Users, Clock, ArrowUpRight, Calendar, BarChart3 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Bot {
  _id: string;
  name: string;
  metrics: {
    totalConversations: number;
    newMessages24h: number;
    averageResponseTime: number;
    handoverRate: number;
  };
}

export default function AnalyticsPage() {
  const params = useParams()
  const [bot, setBot] = useState<Bot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

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

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Analytics</h1>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading analytics...</div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !bot) {
    return (
      <div className="flex flex-col h-full">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Analytics</h1>
        </header>
        <main className="flex-1 overflow-auto p-6">
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
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Analytics</h1>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Last 30 days
            </Button>
            <Button variant="outline" size="sm">
              Export Data
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        {bot.metrics.totalConversations === 0 ? (
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
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{bot.metrics.totalConversations}</div>
                  <p className="text-xs text-muted-foreground">
                    All time conversations
                  </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Messages (24h)</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{bot.metrics.newMessages24h}</div>
                  <p className="text-xs text-muted-foreground">
                    New messages today
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
                    {bot.metrics.averageResponseTime > 0 ? `${bot.metrics.averageResponseTime}s` : 'N/A'}
                </div>
                  <p className="text-xs text-muted-foreground">
                    Average response time
                  </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Handover Rate</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{bot.metrics.handoverRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Human takeover rate
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Coming Soon Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="opacity-60">
                <CardHeader>
                  <CardTitle>Conversation Trends</CardTitle>
                  <CardDescription>Daily conversation volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">Chart coming soon</p>
                    </div>
                </div>
              </CardContent>
            </Card>

              <Card className="opacity-60">
                <CardHeader>
                  <CardTitle>Top User Questions</CardTitle>
                  <CardDescription>Most frequently asked questions</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">Question analysis coming soon</p>
                    </div>
                </div>
              </CardContent>
            </Card>
          </div>

            {/* Performance Insights */}
            <Card className="opacity-60">
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
                <CardDescription>
                  AI-powered insights about your bot's performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Coming Soon: Advanced Analytics</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• User satisfaction scores</li>
                      <li>• Conversation resolution rates</li>
                      <li>• Peak usage times and patterns</li>
                      <li>• Webhook performance metrics</li>
                      <li>• Custom goal tracking</li>
                    </ul>
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