'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Settings, ExternalLink, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { showSuccess, showError } from '@/lib/toast'

interface CloudIntegration {
  id: string
  name: string
  description: string
  icon: string
  status: 'connected' | 'not-connected'
  connectedAccounts?: number
  features: string[]
}

const cloudIntegrations: CloudIntegration[] = [
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Track website traffic and user behavior',
    icon: '📊',
    status: 'not-connected',
    features: ['Traffic analysis', 'User behavior tracking', 'Conversion metrics', 'Real-time reports']
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Manage calendar events and scheduling',
    icon: '📅',
    status: 'not-connected',
    features: ['Event management', 'Scheduling automation', 'Calendar sync', 'Meeting coordination']
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    description: 'Read and write spreadsheet data',
    icon: '📈',
    status: 'connected',
    connectedAccounts: 1,
    features: ['Data import/export', 'Automated reporting', 'Data analysis', 'Collaborative editing']
  },
  {
    id: 'google-translate',
    name: 'Google Translate',
    description: 'Translate text between languages',
    icon: '🌐',
    status: 'not-connected',
    features: ['Multi-language support', 'Real-time translation', 'Language detection', 'Batch translation']
  }
]

export default function CloudIntegrationsPage() {
  const [integrations, setIntegrations] = useState<CloudIntegration[]>(cloudIntegrations)
  const [loading, setLoading] = useState<string | null>(null)
  const [expandedIntegration, setExpandedIntegration] = useState<string | null>(null)

  const handleConnect = async (integrationId: string) => {
    setLoading(integrationId)
    
    try {
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
            setIntegrations(prev => prev.map(integration => 
              integration.id === integrationId 
                ? { ...integration, status: 'connected' as const, connectedAccounts: 1 }
                : integration
            ))
            showSuccess(`Connected to ${integrations.find(i => i.id === integrationId)?.name}!`)
            setLoading(null)
          }
        }, 1000)
      }
    } catch (error) {
      showError(`Failed to connect to ${integrations.find(i => i.id === integrationId)?.name}`)
      setLoading(null)
    }
  }

  const handleDisconnect = async (integrationId: string) => {
    setLoading(integrationId)
    
    try {
      await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disconnect',
          integrationType: integrationId
        })
      })
      
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, status: 'not-connected' as const, connectedAccounts: undefined }
          : integration
      ))
      showSuccess(`Disconnected from ${integrations.find(i => i.id === integrationId)?.name}`)
    } catch (error) {
      showError(`Failed to disconnect from ${integrations.find(i => i.id === integrationId)?.name}`)
    } finally {
      setLoading(null)
    }
  }

  const toggleExpanded = (integrationId: string) => {
    setExpandedIntegration(expandedIntegration === integrationId ? null : integrationId)
  }

  const getStatusText = (integration: CloudIntegration) => {
    if (integration.status === 'connected') {
      return integration.connectedAccounts 
        ? `Connected Accounts: ${integration.connectedAccounts}`
        : 'Connected'
    }
    return 'Not connected'
  }

  const getStatusColor = (integration: CloudIntegration) => {
    return integration.status === 'connected' 
      ? 'text-green-600' 
      : 'text-gray-500'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/integrations">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Integrations
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cloud Integrations</h1>
              <p className="text-sm text-gray-600">Connect your bots with Google Cloud services</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Note Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Integration settings updated here are global across all bots.
          </p>
        </div>

        {/* Description */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Cloud Integrations</h2>
          <p className="text-gray-600">
            Use sections below to setup integrations with your Cloud Systems.
          </p>
        </div>

        {/* Frequently Used Apps */}
        <div className="mb-8">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Frequently Used Apps</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {integrations.map(integration => (
              <Card key={integration.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{integration.icon}</div>
                      <div>
                        <CardTitle className="text-base">{integration.name}</CardTitle>
                        <p className={`text-sm ${getStatusColor(integration)}`}>
                          {getStatusText(integration)}
                        </p>
                      </div>
                    </div>
                    {integration.status === 'connected' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(integration.id)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {expandedIntegration === integration.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  <CardDescription className="text-sm">
                    {integration.description}
                  </CardDescription>
                </CardHeader>
                
                {expandedIntegration === integration.id && integration.status === 'connected' && (
                  <CardContent className="pt-0">
                    <div className="space-y-3">
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
                      
                      <div className="flex space-x-2 pt-2">
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
                      </div>
                    </div>
                  </CardContent>
                )}

                {integration.status === 'not-connected' && (
                  <CardContent className="pt-0">
                    <div className="space-y-3">
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
                      
                      <div className="flex space-x-2 pt-2">
                        <Button
                          onClick={() => handleConnect(integration.id)}
                          className="flex-1 bg-teal-600 hover:bg-teal-700"
                          size="sm"
                          disabled={loading === integration.id}
                        >
                          {loading === integration.id ? 'Connecting...' : 'Connect'}
                        </Button>
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
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
