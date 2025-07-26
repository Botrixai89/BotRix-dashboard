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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        {/* Logo Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200" style={{height: '80px'}}>
          <div className="flex items-center justify-center flex-1">
            <img src="/botrix-logo01.png" alt="Botrix Logo" className="h-10 w-auto" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-teal-50 text-teal-600 p-2"
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
        {/* Navigation */}
        <nav className={`mt-4 ${sidebarOpen ? 'px-4' : 'px-1'}`}>
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
                      ? 'text-white bg-teal-600 shadow-sm'
                      : 'text-gray-600 hover:text-teal-600 hover:bg-teal-50'
                  }`}
                >
                  <Icon className={`${sidebarOpen ? 'mr-3' : 'mr-0'} h-5 w-5`} />
                  {sidebarOpen && <span>{item.name}</span>}
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