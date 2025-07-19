'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Bot, MessageSquare, TrendingUp, Settings, Sparkles, LogOut, User } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth, useRequireAuth } from '@/lib/auth-context'

interface BotData {
  _id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'draft';
  metrics: {
    totalConversations: number;
    newMessages24h: number;
    averageResponseTime: number;
    handoverRate: number;
  };
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const { loading } = useRequireAuth() // This will redirect to login if not authenticated
  const [bots, setBots] = useState<BotData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user && !loading) {
      fetchBots()
    }
  }, [user, loading])

  const fetchBots = async () => {
    try {
      const response = await fetch('/api/bots', {
        credentials: 'include'
      })
      const result = await response.json()

      if (response.ok) {
        setBots(result.bots || [])
      } else {
        setError(result.error || 'Failed to fetch bots')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Sidebar */}
      <div className="w-64 bg-white/80 backdrop-blur-sm border-r border-purple-100 shadow-sm">
        <div className="flex items-center px-6 py-6 border-b border-purple-100">
          <div className="p-2 rounded-xl gradient-primary mr-3">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">Botrix</span>
        </div>
        
        <nav className="mt-6 px-4">
          <div className="space-y-2">
            <Link href="/dashboard" className="flex items-center px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-md">
              <Bot className="mr-3 h-5 w-5" />
              My Bots
            </Link>
            <Link href="/dashboard/settings" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all">
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </Link>
          </div>
        </nav>

        {/* User Profile */}
        {user && (
          <div className="absolute bottom-6 left-4 right-4">
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-purple-100">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="w-full text-xs border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                <LogOut className="h-3 w-3 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-8 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Bots</h1>
              <p className="text-gray-600 mt-1">Create and manage your chatbots</p>
            </div>
            <Link href="/dashboard/create-bot">
              <Button className="gradient-primary text-white border-0 px-6 py-3 hover:shadow-lg hover:scale-105 transition-all">
                <Plus className="mr-2 h-5 w-5" />
                Create New Bot
              </Button>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-8">
          {isLoading ? (
            /* Loading State */
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 rounded-full gradient-primary mb-6">
                <Bot className="h-12 w-12 text-white animate-pulse" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Loading your bots...
              </h2>
              <p className="text-gray-600">Please wait while we fetch your chatbots</p>
            </div>
          ) : error ? (
            /* Error State */
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 rounded-full bg-red-100 text-red-600 mb-6">
                <Bot className="h-12 w-12" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Error loading bots
              </h2>
              <p className="text-gray-600 mb-6 max-w-md">
                {error}
              </p>
              <Button onClick={fetchBots} className="gradient-primary text-white border-0">
                Try Again
              </Button>
            </div>
          ) : bots.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto">
              <div className="relative mb-8">
                <div className="p-6 rounded-full gradient-primary mb-4">
                  <Bot className="h-16 w-16 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 p-2 rounded-full bg-yellow-400">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Let's build your first bot!
              </h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Create intelligent chatbots to automate customer support, lead generation, 
                and enhance user engagement on your website.
              </p>
              <Link href="/dashboard/create-bot">
                <Button size="lg" className="gradient-primary text-white border-0 px-8 py-4 hover:shadow-xl hover:scale-105 transition-all">
                  <Plus className="mr-2 h-6 w-6" />
                  Create Your First Bot
                </Button>
              </Link>
              
              {/* Features preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full">
                <div className="text-center p-6 bg-white/50 rounded-xl border border-purple-100">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Smart Conversations</h3>
                  <p className="text-sm text-gray-600">AI-powered responses that understand context</p>
                </div>
                <div className="text-center p-6 bg-white/50 rounded-xl border border-purple-100">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Real-time Analytics</h3>
                  <p className="text-sm text-gray-600">Track performance and user engagement</p>
                </div>
                <div className="text-center p-6 bg-white/50 rounded-xl border border-purple-100">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Settings className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Easy Setup</h3>
                  <p className="text-sm text-gray-600">No coding required, launch in minutes</p>
                </div>
              </div>
            </div>
          ) : (
            /* Bot Cards Grid */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Your Bots ({bots.length})
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bots.map((bot) => (
                  <Card key={bot._id} className="border-0 shadow-sm hover-lift card-glow bg-white/70 backdrop-blur-sm cursor-pointer">
                    <Link href={`/dashboard/bots/${bot._id}`}>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl text-gray-900">{bot.name}</CardTitle>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            bot.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : bot.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {bot.status}
                          </div>
                        </div>
                        <CardDescription className="text-gray-600">
                          {bot.description || 'No description provided'}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center justify-center mb-1">
                              <MessageSquare className="h-4 w-4 text-blue-600 mr-1" />
                              <span className="text-xs text-blue-600 font-medium">Conversations</span>
                            </div>
                            <div className="text-lg font-bold text-blue-900">{bot.metrics.totalConversations}</div>
                          </div>
                          
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center justify-center mb-1">
                              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                              <span className="text-xs text-green-600 font-medium">New (24h)</span>
                            </div>
                            <div className="text-lg font-bold text-green-900">{bot.metrics.newMessages24h}</div>
                          </div>
                        </div>
                        
                        {bot.status === 'active' && (
                          <div className="pt-3 border-t border-gray-100">
                            <div className="text-center">
                              <span className="text-xs text-gray-500">
                                Avg. response: {bot.metrics.averageResponseTime}s
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
} 