'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Bot, BarChart3, MessageSquare, Settings, Code, Wrench, Menu, ChevronLeft, ChevronRight, X, Home } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams, usePathname } from 'next/navigation'

interface BotData {
  _id: string;
  name: string;
  status: 'active' | 'inactive' | 'draft';
  companyLogo?: string | null;
}

export default function BotLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()
  const [bot, setBot] = useState<BotData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)

  // Persist collapsed state in localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed')
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed))
  }, [isCollapsed])

  useEffect(() => {
    fetchBot()
  }, [params.id])

  const fetchBot = async () => {
    try {
      const response = await fetch(`/api/bots/${params.id}`)
      const result = await response.json()

      if (response.ok) {
        setBot(result.bot)
      }
    } catch (err) {
      console.error('Error fetching bot:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const navigation = [
    { name: 'Overview', href: `/dashboard/bots/${params.id}`, icon: BarChart3 },
    { name: 'Messages', href: `/dashboard/bots/${params.id}/messages`, icon: MessageSquare },
    { name: 'Analytics', href: `/dashboard/bots/${params.id}/analytics`, icon: BarChart3 },
    { name: 'Builder', href: `/dashboard/bots/${params.id}/builder`, icon: Wrench },
    { name: 'Settings', href: `/dashboard/bots/${params.id}/settings`, icon: Settings },
    { name: 'Embed', href: `/dashboard/bots/${params.id}/embed`, icon: Code },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="hover:bg-gray-100 text-gray-500 p-2 rounded-lg min-w-[40px] min-h-[40px] flex-shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            {bot && (
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <div className="relative flex-shrink-0">
                  {bot.companyLogo ? (
                    <img 
                      src={bot.companyLogo} 
                      alt="Company Logo" 
                      className="object-cover w-8 h-8 rounded-lg" 
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></div>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-medium text-gray-900 text-sm truncate">{bot.name}</h2>
                </div>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg min-w-[40px] min-h-[40px] flex-shrink-0 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative bg-white w-80 max-w-[85vw] flex flex-col shadow-xl rounded-r-xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 text-base">Navigation</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors min-w-[40px] min-h-[40px]"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link 
                      key={item.name} 
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-colors min-h-[48px] ${
                        isActive
                          ? 'bg-teal-50 text-teal-700 border border-teal-200 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                      }`}>
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className={`text-base ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.name}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex bg-white border-r border-gray-200 flex-col transition-all duration-300 ${
        isCollapsed ? 'lg:w-16' : 'lg:w-64'
      }`}>
        {/* Bot Header */}
        <div className="bg-white border-b border-gray-200">
          <div className={`flex items-center py-3 ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
            {!isCollapsed && (
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="hover:bg-gray-100 text-gray-500 p-1.5 rounded-md border-b-2 border-transparent hover:border-teal-500">
                  <Home className="h-4 w-4" />
                </Button>
              </Link>
            )}
            
            {bot && (
              <div className={`flex items-center ${isCollapsed ? '' : 'space-x-3 flex-1 mx-4'}`}>
                <div className="relative flex-shrink-0 group py-[0.38rem]">
                  {bot.companyLogo ? (
                    <img 
                      src={bot.companyLogo} 
                      alt="Company Logo" 
                      className={`object-cover rounded-lg ${isCollapsed ? 'w-8 h-8' : 'w-10 h-10'}`}
                    />
                  ) : (
                    <div className={`rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ${isCollapsed ? 'w-8 h-8' : 'w-10 h-10'}`}>
                      <Bot className={`text-white ${isCollapsed ? 'h-4 w-4' : 'h-5 w-5'}`} />
                    </div>
                  )}
                  <div className={`absolute bg-green-500 rounded-full border-2 border-white ${isCollapsed ? '-bottom-0.5 -right-0.5 w-2.5 h-2.5' : '-bottom-0.5 -right-0.5 w-3 h-3'}`}></div>
                  
                  {/* Tooltip for bot logo when collapsed */}
                  {isCollapsed && (
                    <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {bot.name}
                      <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                    </div>
                  )}
                </div>

                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <h2 className="font-medium text-gray-900 text-sm truncate">{bot.name}</h2>
                    <p className="text-xs text-gray-500">#{bot._id.slice(-6)}</p>
                  </div>
                )}
              </div>
            )}
            
            {!isCollapsed && <div className="flex-shrink-0 w-6"></div>}
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          <div className="space-y-2">
            {/* Home button for collapsed state */}
            {isCollapsed && (
              <div className="relative group mb-4">
                <Link href="/dashboard">
                  <div className="flex items-center justify-center px-2 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors border-b-2 border-transparent hover:border-teal-500">
                    <Home className="h-4 w-4 flex-shrink-0" />
                  </div>
                </Link>
                
                {/* Tooltip for home button */}
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  Home Dashboard
                  <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                </div>
              </div>
            )}
            
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <div key={item.name} className="relative group">
                  <Link href={item.href}>
                    <div className={`flex items-center rounded-lg transition-colors ${
                      isCollapsed 
                        ? 'justify-center px-2 py-3' 
                        : 'space-x-3 px-3 py-2'
                    } ${
                      isActive
                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}>
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className={isActive ? 'font-medium' : ''}>{item.name}</span>
                      )}
                    </div>
                  </Link>
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.name}
                      <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </nav>
        
        {/* Toggle Button */}
        <div className={`border-t border-gray-200 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          <div className="relative group">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`w-full hover:bg-gray-100 text-gray-500 transition-colors ${
                isCollapsed ? 'justify-center px-2 py-3' : 'justify-center px-3 py-2'
              }`}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
            
            {/* Tooltip for toggle button in collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Expand sidebar
                <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full pt-16 lg:pt-0">
        {children}
      </div>
    </div>
  )
} 