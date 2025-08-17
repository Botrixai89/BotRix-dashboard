'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Bot, MessageSquare, TrendingUp, Settings, Sparkles, LogOut, User, Trash2, MoreVertical, Search, Bell, List, Grid3X3, HelpCircle, SwitchCamera, Play, Upload, Copy, Wrench, X, Menu } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth, useRequireAuth } from '@/lib/auth-context'
import { showSuccess, showError } from '@/lib/toast'
import { UserProfileDropdown } from '@/components/UserProfileDropdown'
import { NotificationDropdown } from '@/components/NotificationDropdown'
import { HelpDropdown } from '@/components/HelpDropdown'
import { Loading, ButtonLoading } from '@/components/ui/loading'
import { FeedbackModal } from '@/components/FeedbackModal'
import { NotificationSettingsModal } from '@/components/NotificationSettingsModal'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const [bots, setBots] = useState<BotData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingBotId, setDeletingBotId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [botToDelete, setBotToDelete] = useState<BotData | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [contextMenuBot, setContextMenuBot] = useState<BotData | null>(null)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const [isAdminMode, setIsAdminMode] = useState(false)



  useEffect(() => {
    // Only proceed if we have a user, not loading, and not logging out
    if (user && !loading && !isLoggingOut) {
      // Add a small delay to ensure NextAuth session is fully established
      const timer = setTimeout(() => {
        fetchBots()
      }, 100)
      
      return () => clearTimeout(timer)
    } else if (!loading && !user && !isLoggingOut) {
      // If not authenticated and not loading, set error
      setError('Authentication required')
      setIsLoading(false)
    }
  }, [user, loading, isLoggingOut])

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteModal) {
          cancelDelete()
        }
        if (contextMenuBot) {
          setContextMenuBot(null)
        }
        if (showAccountModal) {
          closeAccountModal()
        }
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false)
        }
      }
    }

    if (showDeleteModal || contextMenuBot || showAccountModal || isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [showDeleteModal, contextMenuBot, showAccountModal, isMobileMenuOpen])

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenuBot) {
        setContextMenuBot(null)
      }
    }

    if (contextMenuBot) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenuBot])

  const fetchBots = async () => {
    try {
      const response = await fetch('/api/bots', {
        credentials: 'include'
      })
      const result = await response.json()

      if (response.ok) {
        setBots(result.bots || [])
      } else if (response.status === 401) {
        // Authentication error - redirect to login
        setError('Authentication required')
        // Force logout to clear any stale state
        if (!isLoggingOut) {
          setIsLoggingOut(true)
          logout()
        }
      } else {
        setError(result.error || 'Failed to fetch bots')
      }
    } catch (err) {
      console.error('Fetch bots error:', err)
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
    setContextMenuBot(null)
  }

  const handleContextMenuClick = (bot: BotData, e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    const rect = e.currentTarget.getBoundingClientRect()
    const isMobile = window.innerWidth < 768
    const menuWidth = 200
    
    // Adjust position for mobile screens
    let x = rect.right - menuWidth
    let y = rect.bottom + 5
    
    // Ensure menu doesn't go off-screen
    if (x < 10) x = 10
    if (x + menuWidth > window.innerWidth - 10) x = window.innerWidth - menuWidth - 10
    if (y + 200 > window.innerHeight - 10) y = rect.top - 200 - 5
    
    setContextMenuPosition({ x, y })
    setContextMenuBot(bot)
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
    setIsLoggingOut(true)
    logout()
  }

  // Help dropdown handlers
  const handleFeedback = () => {
    showSuccess('Feedback form will open in a new window')
    // You can implement actual feedback functionality here
  }

  const handleHelpDocs = () => {
    showSuccess('Opening help documentation')
    // You can implement actual help docs functionality here
  }

  const handleWhatsApp = () => {
    showSuccess('Connecting to WhatsApp support')
    // You can implement actual WhatsApp integration here
  }

  const handleQuery = () => {
    showSuccess('Opening query form')
    // You can implement actual query functionality here
  }

  const handleReportIssue = () => {
    showSuccess('Opening issue report form')
    // You can implement actual issue reporting here
  }

  const handleExpertAssistance = () => {
    showSuccess('Connecting to expert support')
    // You can implement actual expert assistance here
  }

  // User profile dropdown handlers
  const handleUserFeedback = () => {
    setShowFeedbackModal(true)
  }

  const handleAccountSettings = () => {
    router.push('/dashboard/account-settings')
  }

  const handleAdminMode = () => {
    setIsAdminMode(!isAdminMode)
    showSuccess(isAdminMode ? 'Admin mode disabled' : 'Admin mode enabled')
  }

  const handleIntegrations = () => {
    router.push('/dashboard/integrations')
  }

  const handlePrivacy = () => {
    window.open('https://botrixai.com/privacy', '_blank')
  }

  const handleTerms = () => {
    window.open('https://botrixai.com/terms', '_blank')
  }

  // Notification dropdown handlers
  const handleNotificationSettings = () => {
    setShowNotificationSettings(true)
  }

  const handleClearAllNotifications = () => {
    showSuccess('All notifications cleared')
    // You can implement actual clear notifications here
  }

  // Account modal handlers
  const handleModalAccountSettings = () => {
    closeAccountModal()
    router.push('/dashboard/account-settings')
  }

  const handleManageAccounts = () => {
    showSuccess('Opening manage accounts')
    closeAccountModal()
    // You can implement actual manage accounts here
  }

  const handleAddNewAccount = () => {
    showSuccess('Adding new account')
    closeAccountModal()
    // You can implement actual add new account here
  }

  // Context menu handlers
  const handleExportBot = (bot: BotData) => {
    showSuccess(`Exporting bot: ${bot.name}`)
    setContextMenuBot(null)
    // You can implement actual bot export here
  }

  const handleDuplicateBot = (bot: BotData) => {
    showSuccess(`Duplicating bot: ${bot.name}`)
    setContextMenuBot(null)
    // You can implement actual bot duplication here
  }

  const handleSwitchAccount = () => {
    setShowAccountModal(true)
  }

  const closeAccountModal = () => {
    setShowAccountModal(false)
  }

  const filteredBots = bots.filter(bot => 
    bot.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-[#f4f4f6] sticky top-0 z-40">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Search */}
          <div className="flex items-center space-x-3 sm:space-x-6 flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <img src="/botrix-logo01.png" alt="Botrix Logo" className="h-10 sm:h-[2.8rem] w-auto flex-shrink-0" />
              {isAdminMode && (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2 py-1 rounded-full">
                  Admin Mode
                </span>
              )}
            </div>
            
            {/* Search - Hidden on mobile, shown on tablet+ */}
            <div className="relative hidden sm:block flex-1 max-w-md lg:max-w-lg">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search bots..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent w-full rounded-[50vw] text-sm sm:text-base bg-[#f4f4f6]"
              />
            </div>
          </div>

          {/* Right side - User options */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden p-3 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop navigation items */}
            <div className="hidden sm:flex items-center space-x-4">
              <button 
                onClick={handleSwitchAccount}
                className="text-sm text-gray-600 hover:text-teal-600 transition-colors"
              >
                Switch Account
              </button>

              <span className="text-gray-600">|</span>
              
              {/* Help Dropdown */}
              <HelpDropdown
                onFeedback={handleFeedback}
                onHelpDocs={handleHelpDocs}
                onWhatsApp={handleWhatsApp}
                onQuery={handleQuery}
                onReportIssue={handleReportIssue}
                onExpertAssistance={handleExpertAssistance}
              />
            </div>

            <span className="text-gray-600">|</span>
            
            {/* User profile */}
            {user && (
              <div className="flex items-center space-x-2">
                <span className="hidden sm:block text-sm font-medium text-gray-900">{user.name}</span>
                
                {/* Notification Dropdown */}
                <NotificationDropdown 
                  onSettings={handleNotificationSettings}
                  onClearAll={handleClearAllNotifications}
                />
                
                {/* User Profile Dropdown */}
                <UserProfileDropdown 
                  user={user} 
                  onLogout={handleLogoutClick}
                  isLoggingOut={isLoggingOut}
                  onFeedback={handleUserFeedback}
                  onAccountSettings={handleAccountSettings}
                  onAdminMode={handleAdminMode}
                  onIntegrations={handleIntegrations}
                  onPrivacy={handlePrivacy}
                  onTerms={handleTerms}
                />
              </div>
            )}
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="sm:hidden mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search bots..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent w-full text-base"
            />
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden mt-3 pt-3 border-t border-gray-200">
            <div className="flex flex-col space-y-2">
              <button 
                onClick={handleSwitchAccount}
                className="text-left px-3 py-2 text-sm text-gray-600 hover:text-teal-600 hover:bg-gray-50 rounded-md transition-colors"
              >
                Switch Account
              </button>
              
              {/* Mobile Help Dropdown */}
              <div className="px-3 py-2">
                <HelpDropdown
                  onFeedback={handleFeedback}
                  onHelpDocs={handleHelpDocs}
                  onWhatsApp={handleWhatsApp}
                  onQuery={handleQuery}
                  onReportIssue={handleReportIssue}
                  onExpertAssistance={handleExpertAssistance}
                />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-[#f4f4f6]">
        <div className="max-w-7xl mx-auto">
          {/* User and Bot Count Header */}
          {user && (
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{user.name}</h1>
                  <p className="text-base sm:text-lg text-gray-600">{bots.length} Deployed Bots</p>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Link href="/dashboard/create-bot" className="flex-1 sm:flex-none">
                    <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white border-0 text-sm sm:text-base py-2.5 px-4 rounded-lg font-medium">
                      <Plus className="mr-2 h-4 w-4" />
                      <span className="hidden xs:inline">Create a bot</span>
                      <span className="xs:hidden">Create</span>
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="px-3 sm:px-4 py-2.5 border-gray-200 text-gray-600 hover:bg-gray-50 text-sm sm:text-base rounded-lg font-medium min-w-[44px] sm:min-w-auto"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  >
                    <List className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline text-sm ml-1">List</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            /* Loading State */
            <div className="flex flex-col items-center justify-center h-48 sm:h-64">
              <Loading 
                size="lg" 
                text="Loading your bots..." 
                className="text-center"
              />
            </div>
          ) : error ? (
            /* Error State */
            <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-center">
              <div className="p-4 rounded-full bg-red-100 text-red-600 mb-4 sm:mb-6">
                <Bot className="h-8 w-8 sm:h-12 sm:w-12" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                Error loading bots
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md px-4">
                {error}
              </p>
              <Button onClick={fetchBots} className="bg-teal-600 text-white border-0 hover:bg-teal-700">
                Try Again
              </Button>
            </div>
          ) : filteredBots.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center min-h-[60vh] sm:min-h-[50vh] text-center px-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-teal-100 text-teal-600 mb-6 sm:mb-8 flex items-center justify-center mx-auto">
                <Bot className="h-10 w-10 sm:h-12 sm:w-12" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                {searchQuery ? 'No bots found' : 'No bots yet'}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-8 sm:mb-10 max-w-md leading-relaxed">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Create intelligent chatbots to automate customer support, lead generation, and enhance user engagement on your website.'
                }
              </p>
              {!searchQuery && (
                <Link href="/dashboard/create-bot">
                  <Button size="lg" className="bg-teal-600 text-white border-0 px-8 sm:px-10 py-4 sm:py-5 hover:bg-teal-700 hover:shadow-xl transition-all text-base sm:text-lg font-medium rounded-xl">
                    <Plus className="mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                    Create Your First Bot
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            /* Deployed Bots Grid */
            <div className="space-y-4 sm:space-y-6">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                  {filteredBots.map((bot) => (
                    <Card key={bot._id} className="border border-gray-200 shadow-sm hover:shadow-lg transition-all bg-white relative group rounded-xl">
                      <div className="absolute top-3 sm:top-3 right-3 sm:right-3 z-10">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-gray-100 active:bg-gray-200 transition-colors rounded-lg min-w-[32px] min-h-[32px]"
                          onClick={(e) => handleContextMenuClick(bot, e)}
                        >
                          <MoreVertical className="h-4 w-4 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                      
                      <Link href={`/dashboard/bots/${bot._id}`} className="block hover:bg-gray-50/50 transition-colors rounded-xl">
                        <CardContent className="p-5 sm:p-6">
                          <div className="flex flex-col items-center text-center space-y-4 sm:space-y-4">
                            {/* Bot Icon */}
                            {bot.companyLogo ? (
                              <img src={bot.companyLogo} alt="Company Logo" className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover border" />
                            ) : (
                              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white rounded-lg flex items-center justify-center">
                                  <Bot className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                                </div>
                              </div>
                            )}
                            
                            {/* Bot Name and User Count */}
                            <div className="w-full">
                              <div className="flex items-center justify-center space-x-2 mb-1">
                                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                                <h3 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{bot.name}</h3>
                              </div>
                              <hr className='my-2 border-gray-200' />
                              <p className="text-xs sm:text-sm text-gray-500">
                                {bot.metrics?.totalConversations || 0} Users
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-3">
                  {filteredBots.map((bot) => (
                    <Card key={bot._id} className="border border-gray-200 shadow-sm hover:shadow-lg transition-all bg-white rounded-xl">
                      <Link href={`/dashboard/bots/${bot._id}`} className="block hover:bg-gray-50/50 transition-colors rounded-xl">
                        <CardContent className="p-4 sm:p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                              {bot.companyLogo ? (
                                <img src={bot.companyLogo} alt="Company Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover border flex-shrink-0" />
                              ) : (
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{bot.name}</h3>
                                <p className="text-xs sm:text-sm text-gray-500">{bot.metrics?.totalConversations || 0} Users</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              {bot.status === 'active' && (
                                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                  active
                                </span>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-gray-100 active:bg-gray-200 transition-colors rounded-lg min-w-[32px] min-h-[32px]"
                                onClick={(e) => handleContextMenuClick(bot, e)}
                              >
                                <MoreVertical className="h-4 w-4 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Context Menu */}
      {contextMenuBot && (
        <div 
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[160px] sm:min-w-[180px] max-w-[90vw]"
          style={{ 
            left: contextMenuPosition.x, 
            top: contextMenuPosition.y 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 sm:px-4 py-2 border-b border-gray-100">
            <div className="text-sm font-medium text-gray-900 truncate">{contextMenuBot.name}</div>
          </div>
          
          <div className="py-1">
            <Link href={`/dashboard/bots/${contextMenuBot._id}/builder`}>
              <button className="w-full px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
                <Wrench className="h-4 w-4 flex-shrink-0" />
                <span>Configure</span>
              </button>
            </Link>
            
            <button 
              className="w-full px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
              onClick={() => window.open(`/test-widget.html?botId=${contextMenuBot._id}`, '_blank')}
            >
              <Play className="h-4 w-4 flex-shrink-0" />
              <span>Test</span>
            </button>
            
            <button 
              onClick={() => handleExportBot(contextMenuBot)}
              className="w-full px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
            >
              <Upload className="h-4 w-4 flex-shrink-0" />
              <span>Export</span>
            </button>
            
            <button 
              onClick={() => handleDuplicateBot(contextMenuBot)}
              className="w-full px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
            >
              <Copy className="h-4 w-4 flex-shrink-0" />
              <span>Duplicate</span>
            </button>
            
            <button 
              className="w-full px-3 sm:px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3"
              onClick={(e) => handleDeleteClick(contextMenuBot, e)}
            >
              <Trash2 className="h-4 w-4 flex-shrink-0" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && botToDelete && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={cancelDelete}
        >
          <div 
            className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Bot</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base">
              Are you sure you want to delete <strong>"{botToDelete?.name}"</strong>? 
              This will permanently delete:
            </p>
            
            <ul className="text-sm text-gray-600 mb-4 sm:mb-6 space-y-1">
              <li>• All conversations and messages</li>
              <li>• Bot flows and configurations</li>
              <li>• Team member associations</li>
              <li>• All bot data and settings</li>
            </ul>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                variant="outline"
                onClick={cancelDelete}
                className="flex-1"
                disabled={deletingBotId === botToDelete?._id}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={deleteBot}
                className="flex-1"
                disabled={deletingBotId === botToDelete?._id}
              >
                {deletingBotId === botToDelete?._id ? (
                  <>
                    <ButtonLoading size="sm" />
                    <span className="ml-2">Deleting...</span>
                  </>
                ) : (
                  'Delete Bot'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Account Switching Modal */}
      {showAccountModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeAccountModal}
        >
          <div 
            className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Switch Account</h3>
                  <p className="text-sm text-gray-600">Choose a different account</p>
                </div>
              </div>
              <button
                onClick={closeAccountModal}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {/* Current Account */}
              <div className="p-3 sm:p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs sm:text-sm font-medium text-teal-600">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{user?.name}</div>
                      <div className="text-xs sm:text-sm text-gray-500 truncate">{user?.email}</div>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs bg-teal-100 text-teal-800 rounded-full flex-shrink-0">
                    Current
                  </span>
                </div>
              </div>

              {/* Add New Account */}
              <div 
                onClick={handleAddNewAccount}
                className="p-3 sm:p-4 border border-dashed border-gray-300 rounded-lg hover:border-teal-400 hover:bg-teal-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm sm:text-base">Add New Account</div>
                    <div className="text-xs sm:text-sm text-gray-500">Sign in with a different account</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-3 sm:pt-4 border-t border-gray-200">
                <div className="space-y-1 sm:space-y-2">
                  <button 
                    onClick={handleModalAccountSettings}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Settings className="h-4 w-4 flex-shrink-0" />
                      <span>Account Settings</span>
                    </div>
                  </button>
                  <button 
                    onClick={handleManageAccounts}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span>Manage Accounts</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-6">
              <Button
                variant="outline"
                onClick={closeAccountModal}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  showSuccess('Account switching feature coming soon!')
                  closeAccountModal()
                }}
                className="flex-1 bg-teal-600 hover:bg-teal-700"
              >
                Switch Account
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />

      {/* Notification Settings Modal */}
      <NotificationSettingsModal 
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />
    </div>
  )
} 