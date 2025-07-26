'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Bot, MessageSquare, TrendingUp, Settings, Sparkles, LogOut, User, Trash2, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth, useRequireAuth } from '@/lib/auth-context'
import { showSuccess, showError } from '@/lib/toast'

interface BotData {
  _id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'draft';
  companyLogo?: string | null;
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
  const [deletingBotId, setDeletingBotId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [botToDelete, setBotToDelete] = useState<BotData | null>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  useEffect(() => {
    if (user && !loading) {
      fetchBots()
    }
  }, [user, loading])

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteModal) {
          cancelDelete()
        }
        if (showLogoutModal) {
          cancelLogout()
        }
      }
    }

    if (showDeleteModal || showLogoutModal) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [showDeleteModal, showLogoutModal])

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

  const handleDeleteClick = (bot: BotData, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setBotToDelete(bot)
    setShowDeleteModal(true)
  }

  const deleteBot = async () => {
    if (!botToDelete) return

    setDeletingBotId(botToDelete._id)
    try {
      const response = await fetch(`/api/bots/${botToDelete._id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const result = await response.json()

      if (response.ok) {
        // Remove the bot from the local state
        setBots(bots.filter(bot => bot._id !== botToDelete._id))
        setShowDeleteModal(false)
        setBotToDelete(null)
        showSuccess('Bot deleted successfully!')
      } else {
        const errorMessage = result.error || 'Failed to delete bot'
        setError(errorMessage)
        showError(errorMessage)
      }
    } catch (err) {
      const errorMessage = 'Network error. Please try again.'
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setDeletingBotId(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setBotToDelete(null)
  }

  const handleLogoutClick = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    setShowLogoutModal(false)
    logout()
  }

  const cancelLogout = () => {
    setShowLogoutModal(false)
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Sidebar */}
      <div className="w-64 bg-white/80 backdrop-blur-sm border-r border-purple-100 shadow-sm">
        <div className="flex items-center px-6 py-6 border-b border-purple-100">
          <Link href="/dashboard" className="flex items-center mr-3 hover:opacity-80 transition-opacity">
            <img src="/botrix-logo01.png" alt="Botrix Logo" className="h-8 w-auto" />
          </Link>
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
                onClick={handleLogoutClick}
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
                  <Card key={bot._id} className="border-0 shadow-sm hover-lift card-glow bg-white/70 backdrop-blur-sm relative group">
                    <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          onClick={(e) => handleDeleteClick(bot, e)}
                          disabled={deletingBotId === bot._id}
                        >
                          {deletingBotId === bot._id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <Link href={`/dashboard/bots/${bot._id}`}>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {bot.companyLogo ? (
                              <img src={bot.companyLogo} alt="Company Logo" className="w-10 h-10 rounded-lg object-cover border" />
                            ) : (
                              <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
                                <Bot className="h-5 w-5 text-white" />
                              </div>
                            )}
                            <CardTitle className="text-xl text-gray-900">{bot.name}</CardTitle>
                          </div>
                          {bot.status === 'active' ? (
                            <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              active
                            </div>
                          ) : bot.status === 'inactive' ? (
                            <div className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              inactive
                            </div>
                          ) : null}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && botToDelete && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={cancelDelete}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Bot</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>"{botToDelete.name}"</strong>? 
              This will permanently delete:
            </p>
            
            <ul className="text-sm text-gray-600 mb-6 space-y-1">
              <li>• All conversations and messages</li>
              <li>• Bot flows and configurations</li>
              <li>• Team member associations</li>
              <li>• All bot data and settings</li>
            </ul>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={cancelDelete}
                className="flex-1"
                disabled={deletingBotId === botToDelete._id}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={deleteBot}
                className="flex-1"
                disabled={deletingBotId === botToDelete._id}
              >
                {deletingBotId === botToDelete._id ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete Bot'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={cancelLogout}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <LogOut className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sign Out</h3>
                <p className="text-sm text-gray-600">Are you sure you want to sign out?</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              You will be logged out of your account and redirected to the login page.
            </p>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={cancelLogout}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={confirmLogout}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 