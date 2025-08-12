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
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Bot Header */}
        <div className="p-6 border-b border-gray-200">
          {/* Logo and Back Button */}
          <div className="flex items-center justify-between mb-4">
            <img src="/botrix-logo01.png" alt="Botriut x Logo" className="h-10 w-auto" />
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="hover:bg-teal-50 text-teal-600 p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {bot && (
            <div className="flex items-center space-x-3">
              {bot.companyLogo ? (
                <img 
                  src={bot.companyLogo} 
                  alt="Company Logo" 
                  className="object-cover border border-gray-200 w-10 h-10 rounded-lg" 
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
              )}
              <div>
                <h2 className="font-semibold text-gray-900">{bot.name}</h2>
                <p className="text-sm text-gray-500">Customer Support</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 border border-teal-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}>
                    <Icon className="h-4 w-4" />
                    <span className={isActive ? 'font-medium' : ''}>{item.name}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full">
        {children}
      </div>
    </div>
  )
} 