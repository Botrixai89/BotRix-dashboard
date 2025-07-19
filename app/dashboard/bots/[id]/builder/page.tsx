'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, MessageSquare, Save, Settings, Zap, Globe, Palette, TestTube, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { showSuccess, showError } from '@/lib/toast'

interface Bot {
  _id: string;
  name: string;
  status: string;
  settings: {
    webhookUrl: string;
    welcomeMessage: string;
    fallbackMessage: string;
    primaryColor: string;
  };
}

interface TestResult {
  webhookTest: {
    status: string;
    message: string;
    statusCode?: number;
    response?: any;
    error?: string;
  };
}

export default function BuilderPage() {
  const params = useParams()
  const [bot, setBot] = useState<Bot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isTestingWebhook, setIsTestingWebhook] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    webhookUrl: '',
    welcomeMessage: '',
    fallbackMessage: '',
    primaryColor: ''
  })

  useEffect(() => {
    fetchBot()
  }, [params.id])

  const fetchBot = async () => {
    try {
      const response = await fetch(`/api/bots/${params.id}`)
      const result = await response.json()

      if (response.ok) {
        setBot(result.bot)
        setFormData({
          webhookUrl: result.bot.settings.webhookUrl || '',
          welcomeMessage: result.bot.settings.welcomeMessage || '',
          fallbackMessage: result.bot.settings.fallbackMessage || '',
          primaryColor: result.bot.settings.primaryColor || '#7c3aed'
        })
      } else {
        setError(result.error || 'Failed to fetch bot')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/bots/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: formData
        }),
      })

      if (response.ok) {
        showSuccess('Bot settings updated successfully!')
        fetchBot() // Refresh the bot data
      } else {
        const result = await response.json()
        showError(result.error || 'Failed to update bot')
      }
    } catch (err) {
      showError('Network error. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const testWebhook = async () => {
    setIsTestingWebhook(true)
    try {
      const response = await fetch(`/api/bots/${params.id}/test`)
      const result = await response.json()
      
      if (response.ok) {
        setTestResult(result)
        if (result.webhookTest.status === 'success') {
          showSuccess('Webhook is working correctly!')
        } else if (result.webhookTest.status === 'demo_mode') {
          showError('Bot is in demo mode - update your webhook URL')
        } else {
          showError('Webhook test failed - check configuration')
        }
      } else {
        showError('Failed to test webhook')
      }
    } catch (err) {
      showError('Failed to test webhook')
    } finally {
      setIsTestingWebhook(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-8 py-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Bot Builder</h1>
        </header>
        <main className="flex-1 overflow-auto p-8">
          <div className="flex items-center justify-center h-64">
            <div className="p-4 rounded-full gradient-primary">
              <Settings className="h-8 w-8 text-white animate-pulse" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !bot) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-8 py-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Bot Builder</h1>
        </header>
        <main className="flex-1 overflow-auto p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="p-4 rounded-full bg-red-100 text-red-600 mb-4 inline-block">
                <Settings className="h-8 w-8" />
              </div>
              <div className="text-red-600 font-medium">{error || 'Bot not found'}</div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const isUsingDemoWebhook = formData.webhookUrl === 'https://automation.botrixai.com/webhook/8b0df4ab-cb69-48d7-b3f4-d8a68a420ef8/chat'

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-8 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bot Builder</h1>
            <p className="text-gray-600 mt-1">Configure your bot's behavior and responses</p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
              onClick={testWebhook}
              disabled={isTestingWebhook}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isTestingWebhook ? 'Testing...' : 'Test Webhook'}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="gradient-primary text-white border-0"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-8 space-y-8">
        {/* Webhook Status Warning */}
        {isUsingDemoWebhook && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-l-yellow-400">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                <div>
                  <CardTitle className="text-lg text-yellow-900">Demo Mode Active</CardTitle>
                  <CardDescription className="text-yellow-700">
                    Your bot is using the demo webhook URL. Update it below to get real AI responses.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Webhook Test Results */}
        {testResult && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  testResult.webhookTest.status === 'success' ? 'bg-green-500' :
                  testResult.webhookTest.status === 'demo_mode' ? 'bg-yellow-500' :
                  'bg-red-500'
                } text-white`}>
                  {testResult.webhookTest.status === 'success' ? <CheckCircle className="h-5 w-5" /> :
                   testResult.webhookTest.status === 'demo_mode' ? <AlertTriangle className="h-5 w-5" /> :
                   <XCircle className="h-5 w-5" />}
                </div>
                <div>
                  <CardTitle>Webhook Test Result</CardTitle>
                  <CardDescription>{testResult.webhookTest.message}</CardDescription>
                </div>
              </div>
            </CardHeader>
            {testResult.webhookTest.response && (
              <CardContent>
                <div className="space-y-2">
                                          <Label className="font-medium">Response from Webhook:</Label>
                  <pre className="text-sm bg-gray-100 p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(testResult.webhookTest.response, null, 2)}
                  </pre>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Webhook Integration Settings */}
        <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Webhook Integration</CardTitle>
                <CardDescription>
                  Configure your webhook for intelligent responses
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="webhookUrl" className="text-sm font-semibold text-gray-700">
                Webhook URL *
              </Label>
              <Input
                id="webhookUrl"
                type="url"
                value={formData.webhookUrl}
                onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
                placeholder="https://your-automation.com/webhook/your-webhook-id"
                className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
              />
              <p className="text-sm text-gray-600">
                Replace the demo URL with your actual webhook endpoint
              </p>
              {isUsingDemoWebhook && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Currently using demo URL:</strong> Your bot will only return demo responses until you update this.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="fallbackMessage" className="text-sm font-semibold text-gray-700">
                Fallback Message
              </Label>
              <Input
                id="fallbackMessage"
                value={formData.fallbackMessage}
                onChange={(e) => handleInputChange('fallbackMessage', e.target.value)}
                placeholder="I'm sorry, I didn't understand that. Can you please rephrase?"
                className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
              />
              <p className="text-sm text-gray-600">
                Message shown when webhook fails or doesn't respond
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bot Personality Settings */}
        <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Bot Personality</CardTitle>
                <CardDescription>
                  Customize your bot's appearance and initial greeting
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="welcomeMessage" className="text-sm font-semibold text-gray-700">
                Welcome Message
              </Label>
              <Input
                id="welcomeMessage"
                value={formData.welcomeMessage}
                onChange={(e) => handleInputChange('welcomeMessage', e.target.value)}
                placeholder="Hello! How can I help you today?"
                className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
              />
              <p className="text-sm text-gray-600">
                The first message visitors see when they open the chat
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="primaryColor" className="text-sm font-semibold text-gray-700">
                Primary Color
              </Label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  className="w-16 h-12 rounded-lg border-2 border-white shadow-lg cursor-pointer"
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  placeholder="#7c3aed"
                  className="flex-1 h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                />
              </div>
              <p className="text-sm text-gray-600">
                The color used for your chat widget header and buttons
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Setup Guide */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="text-xl">📚 Webhook Setup Guide</CardTitle>
            <CardDescription>
              How to set up your automation workflow for intelligent responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">1. Create Webhook</h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Add a "Webhook" node to your automation workflow</li>
                  <li>Set HTTP Method to "POST"</li>
                  <li>Copy the webhook URL and paste it above</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">2. Process the Message</h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Add your AI processing nodes (OpenAI, etc.)</li>
                  <li>Use the incoming message: <code className="bg-white px-1 rounded">{'{{$json.message}}'}</code></li>
                  <li>Access bot settings: <code className="bg-white px-1 rounded">{'{{$json.botSettings}}'}</code></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">3. Return Response</h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Add a "Respond to Webhook" node</li>
                  <li>Return JSON: <code className="bg-white px-1 rounded">{'{"message": "Your AI response"}'}</code></li>
                  <li>Or use: <code className="bg-white px-1 rounded">{'{"response": "Your AI response"}'}</code></li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 