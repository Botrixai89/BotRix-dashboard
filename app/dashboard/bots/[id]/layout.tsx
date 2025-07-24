'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Bot, BarChart3, MessageSquare, Settings, Users, Code, Wrench, Menu, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    { name: 'Team', href: `/dashboard/bots/${params.id}/team`, icon: Users },
    { name: 'Settings', href: `/dashboard/bots/${params.id}/settings`, icon: Settings },
    { name: 'Embed Code', href: `/dashboard/bots/${params.id}/embed`, icon: Code },
  ]

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Sidebar */}
      <div className={`bg-white/80 backdrop-blur-sm border-r border-purple-100 shadow-sm transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        {/* Sidebar Toggle */}
        <div className="flex items-center justify-between px-2 py-2 border-b border-purple-100">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen((v) => !v)} className="hover:bg-purple-50">
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Button>
          {sidebarOpen && (
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="hover:bg-purple-50 text-purple-600">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          )}
        </div>
        {/* Header */}
        <div className={`flex items-center space-x-3 px-6 py-6 border-b border-purple-100 ${sidebarOpen ? '' : 'justify-center px-2 py-4'}`}> 
          {bot?.companyLogo ? (
            <img src={bot.companyLogo} alt="Company Logo" className={`object-cover border ${sidebarOpen ? 'w-12 h-12 rounded-xl' : 'w-8 h-8 rounded-lg'}`} />
          ) : (
            <div className={`${sidebarOpen ? 'w-12 h-12 rounded-xl' : 'w-8 h-8 rounded-lg'} gradient-primary flex items-center justify-center`}>
              <Bot className={`${sidebarOpen ? 'h-6 w-6' : 'h-5 w-5'} text-white`} />
            </div>
          )}
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg text-gray-900 truncate">
                {isLoading ? 'Loading...' : (bot?.name || 'Bot')}
              </h2>
              {!isLoading && bot && (
                <Badge 
                  variant={bot.status === 'active' ? 'default' : 'secondary'}
                  className={`mt-1 ${
                    bot.status === 'active' 
                      ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                      : bot.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  {bot.status}
                </Badge>
              )}
            </div>
          )}
        </div>
        {/* Navigation */}
        <nav className={`mt-6 ${sidebarOpen ? 'px-4' : 'px-1'}`}>
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center ${sidebarOpen ? 'px-4 py-3' : 'justify-center py-3'} text-sm font-medium rounded-xl transition-all ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-purple-600 to-blue-600 shadow-md'
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${sidebarOpen ? '' : 'mx-auto'}`} />
                  {sidebarOpen && item.name}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
} 