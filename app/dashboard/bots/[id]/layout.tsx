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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Left side - Back button and Bot info */}
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="hover:bg-teal-50 text-teal-600 p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            
            {bot && (
              <div className="flex items-center space-x-3">
                {bot.companyLogo ? (
                  <img 
                    src={bot.companyLogo} 
                    alt="Company Logo" 
                    className="object-cover border border-gray-200 w-8 h-8 rounded-lg" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center border border-gray-200">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="font-bold text-lg text-gray-900">{bot.name}</h1>
                  {bot.status === 'active' && (
                    <span className="inline-block px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">active</span>
                  )}
                  {bot.status === 'inactive' && (
                    <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded">inactive</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right side - Navigation tabs */}
          <div className="flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'text-white bg-teal-600 shadow-sm'
                      : 'text-gray-600 hover:text-teal-600 hover:bg-teal-50'
                  }`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
} 