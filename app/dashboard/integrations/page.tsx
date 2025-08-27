'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Grid3X3, Plus, Settings, ExternalLink, Check, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { showSuccess, showError } from '@/lib/toast'

interface Integration {
  id: string
  name: string
  description: string
  icon: string
  category: string
  status: 'connected' | 'available' | 'coming-soon'
  features: string[]
}

const integrations: Integration[] = [
  // Google Cloud Integrations
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Track website traffic and user behavior with comprehensive analytics',
    icon: '📊',
    category: 'Google Cloud',
    status: 'available',
    features: ['Traffic analysis', 'User behavior tracking', 'Conversion metrics', 'Real-time reports']
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Manage calendar events and scheduling automation',
    icon: '📅',
    category: 'Google Cloud',
    status: 'available',
    features: ['Event management', 'Scheduling automation', 'Calendar sync', 'Meeting coordination']
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    description: 'Read and write spreadsheet data for data management',
    icon: '📈',
    category: 'Google Cloud',
    status: 'available',
    features: ['Data import/export', 'Automated reporting', 'Data analysis', 'Collaborative editing']
  },
  {
    id: 'google-translate',
    name: 'Google Translate',
    description: 'Translate text between languages for multilingual support',
    icon: '🌐',
    category: 'Google Cloud',
    status: 'available',
    features: ['Multi-language support', 'Real-time translation', 'Language detection', 'Batch translation']
  },
  // Other Integrations
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send notifications and manage bots directly from Slack channels',
    icon: '💬',
    category: 'Communication',
    status: 'available',
    features: ['Real-time notifications', 'Bot management', 'Channel integration']
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Deploy your bots on WhatsApp for customer communication',
    icon: '📱',
    category: 'Messaging',
    status: 'connected',
    features: ['Message automation', 'Customer support', 'Rich media support']
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Integrate with your Shopify store for e-commerce automation',
    icon: '🛒',
    category: 'E-commerce',
    status: 'available',
    features: ['Order tracking', 'Product recommendations', 'Customer service']
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect with 3000+ apps through Zapier automation',
    icon: '⚡',
    category: 'Automation',
    status: 'available',
    features: ['Workflow automation', 'Data sync', 'Trigger actions']
  },
  {
    id: 'facebook',
    name: 'Facebook Messenger',
    description: 'Deploy bots on Facebook Messenger for social engagement',
    icon: '📘',
    category: 'Social',
    status: 'coming-soon',
    features: ['Social automation', 'Lead generation', 'Customer engagement']
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Create powerful Telegram bots for communities and support',
    icon: '✈️',
    category: 'Messaging',
    status: 'coming-soon',
    features: ['Group management', 'Automated responses', 'File sharing']
  }
]

export default function IntegrationsPage() {
  const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>(['whatsapp'])
  const [loading, setLoading] = useState<string | null>(null)

  const handleConnect = async (integrationId: string) => {
    setLoading(integrationId)
    
    try {
      if (integrationId.startsWith('google-')) {
        // Handle Google OAuth flow
        const response = await fetch(`/api/integrations/google/${integrationId.replace('google-', '')}?action=auth`)
        const data = await response.json()
        
        if (data.authUrl) {
          // Open OAuth popup
          const popup = window.open(
            data.authUrl,
            'google-oauth',
            'width=500,height=600,scrollbars=yes,resizable=yes'
          )
          
          // Listen for OAuth completion
          const checkClosed = setInterval(() => {
            if (popup?.closed) {
              clearInterval(checkClosed)
              setConnectedIntegrations(prev => [...prev, integrationId])
              showSuccess(`Connected to ${integrations.find(i => i.id === integrationId)?.name}!`)
              setLoading(null)
            }
          }, 1000)
        }
      } else {
        // Handle other integrations
        setConnectedIntegrations(prev => [...prev, integrationId])
        showSuccess(`Connected to ${integrations.find(i => i.id === integrationId)?.name}!`)
      }
    } catch (error) {
      showError(`Failed to connect to ${integrations.find(i => i.id === integrationId)?.name}`)
    } finally {
      setLoading(null)
    }
  }

  const handleDisconnect = async (integrationId: string) => {
    setLoading(integrationId)
    
    try {
      if (integrationId.startsWith('google-')) {
        // Disconnect Google integration
        await fetch('/api/integrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'disconnect',
            integrationType: integrationId
          })
        })
      }
      
      setConnectedIntegrations(prev => prev.filter(id => id !== integrationId))
      showSuccess(`Disconnected from ${integrations.find(i => i.id === integrationId)?.name}`)
    } catch (error) {
      showError(`Failed to disconnect from ${integrations.find(i => i.id === integrationId)?.name}`)
    } finally {
      setLoading(null)
    }
  }

  const getStatusBadge = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Check className="h-3 w-3 mr-1" />
            Connected
          </span>
        )
      case 'available':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Available
          </span>
        )
      case 'coming-soon':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Coming Soon
          </span>
        )
    }
  }

  const categories = Array.from(new Set(integrations.map(i => i.category)))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
              <p className="text-sm text-gray-600">Connect your bots with popular platforms and services</p>
            </div>
          </div>
          <Button className="bg-teal-600 hover:bg-teal-700">
            <Plus className="h-4 w-4 mr-2" />
            Request Integration
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Connected</p>
                  <p className="text-2xl font-bold text-gray-900">{connectedIntegrations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Grid3X3 className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Available</p>
                  <p className="text-2xl font-bold text-gray-900">{integrations.filter(i => i.status === 'available').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Settings className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{integrations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integrations by Category */}
        {categories.map(category => (
          <div key={category} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{category}</h2>
              {category === 'Google Cloud' && (
                <Link href="/dashboard/integrations/cloud-integrations">
                  <Button variant="outline" size="sm">
                    View All Cloud Integrations
                  </Button>
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations
                .filter(integration => integration.category === category)
                .map(integration => {
                  const isConnected = connectedIntegrations.includes(integration.id)
                  
                  return (
                    <Card key={integration.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{integration.icon}</div>
                            <div>
                              <CardTitle className="text-lg">{integration.name}</CardTitle>
                              {getStatusBadge(integration.status)}
                            </div>
                          </div>
                          {integration.status === 'available' || isConnected ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                        <CardDescription className="mt-2">
                          {integration.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Features:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {integration.features.map((feature, index) => (
                                <li key={index} className="flex items-center">
                                  <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="flex space-x-2">
                            {integration.status === 'available' && !isConnected && (
                              <Button
                                onClick={() => handleConnect(integration.id)}
                                className="flex-1 bg-teal-600 hover:bg-teal-700"
                                size="sm"
                                disabled={loading === integration.id}
                              >
                                {loading === integration.id ? 'Connecting...' : 'Connect'}
                              </Button>
                            )}
                            
                            {isConnected && (
                              <>
                                <Button
                                  onClick={() => handleDisconnect(integration.id)}
                                  variant="outline"
                                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                                  size="sm"
                                  disabled={loading === integration.id}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  {loading === integration.id ? 'Disconnecting...' : 'Disconnect'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                >
                                  <Settings className="h-4 w-4 mr-1" />
                                  Configure
                                </Button>
                              </>
                            )}
                            
                            {integration.status === 'coming-soon' && (
                              <Button
                                disabled
                                variant="outline"
                                className="flex-1"
                                size="sm"
                              >
                                Coming Soon
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
