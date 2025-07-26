'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, MessageSquare, Save, Settings, Zap, Globe, Palette, TestTube, AlertTriangle, CheckCircle, XCircle, Volume2, VolumeX, Play, Pause } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { showSuccess, showError } from '@/lib/toast'
import { getVoiceService } from '@/lib/voice-service'

interface Bot {
  _id: string;
  name: string;
  status: string;
  settings: {
    webhookUrl: string;
    welcomeMessage: string;
    fallbackMessage: string;
    primaryColor: string;
    widgetIcon?: string;
    widgetIconType: string;
    widgetIconEmoji: string;
    voiceEnabled: boolean;
    voiceSettings: {
      voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
      speed: number;
      pitch: number;
      language: string;
    };
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
    primaryColor: '',
    widgetIcon: '',
    widgetIconType: 'default', // string, not a union type
    widgetIconEmoji: '💬',
    voiceEnabled: false,
    voiceSettings: {
      voice: 'alloy' as const,
      speed: 1.0,
      pitch: 1.0,
      language: 'en-US'
    },
    headerColor: '#8b5cf6',
    footerColor: '#f8fafc',
    bodyColor: '#ffffff',
    logo: '',
    widgetImages: [''] as string[]
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
          webhookUrl: result.bot.settings?.webhookUrl || '',
          welcomeMessage: result.bot.settings?.welcomeMessage || '',
          fallbackMessage: result.bot.settings?.fallbackMessage || '',
          primaryColor: result.bot.settings?.primaryColor || '#7c3aed',
          widgetIcon: result.bot.settings?.widgetIcon || '',
          widgetIconType: result.bot.settings?.widgetIconType || 'default',
          widgetIconEmoji: result.bot.settings?.widgetIconEmoji || '💬',
          voiceEnabled: result.bot.settings?.voiceEnabled || false,
          voiceSettings: {
            voice: result.bot.settings?.voiceSettings?.voice || 'alloy',
            speed: result.bot.settings?.voiceSettings?.speed || 1.0,
            pitch: result.bot.settings?.voiceSettings?.pitch || 1.0,
            language: result.bot.settings?.voiceSettings?.language || 'en-US'
          },
          headerColor: result.bot.settings?.headerColor || '#8b5cf6',
          footerColor: result.bot.settings?.footerColor || '#f8fafc',
          bodyColor: result.bot.settings?.bodyColor || '#ffffff',
          logo: result.bot.settings?.logo || '',
          widgetImages: result.bot.settings?.widgetImages || ['']
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
      // Validate required fields
      if (!formData.webhookUrl.trim()) {
        showError('Webhook URL is required')
        return
      }

      // Validate voice settings
      if (formData.voiceEnabled) {
        if (formData.voiceSettings.speed < 0.25 || formData.voiceSettings.speed > 4.0) {
          showError('Voice speed must be between 0.25 and 4.0')
          return
        }
        if (formData.voiceSettings.pitch < 0.25 || formData.voiceSettings.pitch > 4.0) {
          showError('Voice pitch must be between 0.25 and 4.0')
          return
        }
      }

      // Clean up widget images array by removing empty strings
      const cleanedWidgetImages = (formData.widgetImages || []).filter((img: string) => img.trim() !== '')

      const settingsData = {
        webhookUrl: formData.webhookUrl,
        welcomeMessage: formData.welcomeMessage,
        fallbackMessage: formData.fallbackMessage,
        primaryColor: formData.primaryColor,
        widgetIcon: formData.widgetIcon,
        widgetIconType: formData.widgetIconType,
        widgetIconEmoji: formData.widgetIconEmoji,
        voiceEnabled: formData.voiceEnabled,
        voiceSettings: formData.voiceSettings,
        headerColor: formData.headerColor,
        footerColor: formData.footerColor,
        bodyColor: formData.bodyColor,
        logo: formData.logo,
        widgetImages: cleanedWidgetImages
      }

      console.log('Saving bot settings:', settingsData)

      const response = await fetch(`/api/bots/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: settingsData
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Save successful:', result)
        showSuccess('Bot settings updated successfully!')
        await fetchBot() // Refresh the bot data
      } else {
        const result = await response.json()
        console.error('Save failed:', result)
        showError(result.error || 'Failed to update bot')
      }
    } catch (err) {
      console.error('Save error:', err)
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleVoiceSettingsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      voiceSettings: {
        ...prev.voiceSettings,
        [field]: value
      }
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
        {/* Webhook Test Results */}
        {testResult && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  testResult.webhookTest.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                } text-white`}>
                  {testResult.webhookTest.status === 'success' ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
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
                Enter your webhook endpoint URL for intelligent responses
              </p>
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

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">
                Widget Icon
              </Label>
              <div className="space-y-4">
                {/* Icon Type Selection */}
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="widgetIconType"
                      value="default"
                      checked={formData.widgetIconType === 'default'}
                      onChange={(e) => handleInputChange('widgetIconType', e.target.value)}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Default</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="widgetIconType"
                      value="emoji"
                      checked={formData.widgetIconType === 'emoji'}
                      onChange={(e) => handleInputChange('widgetIconType', e.target.value)}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Emoji</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="widgetIconType"
                      value="custom"
                      checked={formData.widgetIconType === 'custom'}
                      onChange={(e) => handleInputChange('widgetIconType', e.target.value)}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Custom Image</span>
                  </label>
                </div>

                {/* Emoji Input */}
                {formData.widgetIconType === 'emoji' && (
                  <div className="space-y-2">
                    <Label htmlFor="widgetIconEmoji" className="text-sm font-medium text-gray-700">
                      Choose Emoji
                    </Label>
                    <div className="flex items-center space-x-3">
                      <Input
                        id="widgetIconEmoji"
                        value={formData.widgetIconEmoji}
                        onChange={(e) => handleInputChange('widgetIconEmoji', e.target.value)}
                        placeholder="💬"
                        className="w-20 h-12 text-center text-2xl border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                      <div className="flex space-x-2">
                        {['💬', '🤖', '👋', '💡', '🎯', '⭐', '🚀', '💎'].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleInputChange('widgetIconEmoji', emoji)}
                            className="w-10 h-10 text-xl border border-gray-200 rounded-lg hover:border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Image Input */}
                {formData.widgetIconType === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="widgetIcon" className="text-sm font-medium text-gray-700">
                      Custom Icon URL
                    </Label>
                    <Input
                      id="widgetIcon"
                      type="url"
                      value={formData.widgetIcon}
                      onChange={(e) => handleInputChange('widgetIcon', e.target.value)}
                      placeholder="https://example.com/your-icon.png"
                      className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                    />
                    <p className="text-sm text-gray-600">
                      Enter a URL to your custom icon (PNG, JPG, or SVG recommended)
                    </p>
                  </div>
                )}

                {/* Icon Preview */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Icon Preview
                  </Label>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                      {formData.widgetIconType === 'default' && (
                        <MessageSquare className="h-6 w-6 text-gray-600" />
                      )}
                      {formData.widgetIconType === 'emoji' && (
                        <span className="text-2xl">{formData.widgetIconEmoji}</span>
                      )}
                      {formData.widgetIconType === 'custom' && formData.widgetIcon && (
                        <img 
                          src={formData.widgetIcon} 
                          alt="Custom Icon" 
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      )}
                      {formData.widgetIconType === 'custom' && !formData.widgetIcon && (
                        <span className="text-gray-400 text-sm">No image</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      This is how your widget icon will appear
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="headerColor" className="text-sm font-semibold text-gray-700">
                Header Color
              </Label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.headerColor || '#8b5cf6'}
                  onChange={(e) => handleInputChange('headerColor', e.target.value)}
                  className="w-16 h-12 rounded-lg border-2 border-white shadow-lg cursor-pointer"
                />
                <Input
                  value={formData.headerColor || '#8b5cf6'}
                  onChange={(e) => handleInputChange('headerColor', e.target.value)}
                  placeholder="#8b5cf6"
                  className="flex-1 h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                />
              </div>
              <p className="text-sm text-gray-600">
                The color used for your chat widget header
              </p>
            </div>
            <div className="space-y-3">
              <Label htmlFor="footerColor" className="text-sm font-semibold text-gray-700">
                Footer Color
              </Label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.footerColor || '#f8fafc'}
                  onChange={(e) => handleInputChange('footerColor', e.target.value)}
                  className="w-16 h-12 rounded-lg border-2 border-white shadow-lg cursor-pointer"
                />
                <Input
                  value={formData.footerColor || '#f8fafc'}
                  onChange={(e) => handleInputChange('footerColor', e.target.value)}
                  placeholder="#f8fafc"
                  className="flex-1 h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                />
              </div>
              <p className="text-sm text-gray-600">
                The color used for your chat widget footer
              </p>
            </div>
            <div className="space-y-3">
              <Label htmlFor="bodyColor" className="text-sm font-semibold text-gray-700">
                Body Color
              </Label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.bodyColor || '#ffffff'}
                  onChange={(e) => handleInputChange('bodyColor', e.target.value)}
                  className="w-16 h-12 rounded-lg border-2 border-white shadow-lg cursor-pointer"
                />
                <Input
                  value={formData.bodyColor || '#ffffff'}
                  onChange={(e) => handleInputChange('bodyColor', e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1 h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                />
              </div>
              <p className="text-sm text-gray-600">
                The color used for your chat widget body
              </p>
            </div>
            <div className="space-y-3">
              <Label htmlFor="logo" className="text-sm font-semibold text-gray-700">
                Widget Logo (URL)
              </Label>
              <Input
                id="logo"
                type="url"
                value={formData.logo || ''}
                onChange={(e) => handleInputChange('logo', e.target.value)}
                placeholder="https://example.com/your-logo.png"
                className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
              />
              {formData.logo && (
                <img src={formData.logo} alt="Logo preview" className="mt-2 h-16 w-16 object-contain rounded" />
              )}
              <p className="text-sm text-gray-600">
                Upload or provide a URL for your widget logo
              </p>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">
                Widget Images (URLs)
              </Label>
              <div className="space-y-2">
                {(formData.widgetImages || []).map((img: string, idx: number) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <Input
                      value={img}
                      onChange={e => {
                        const newImages = [...(formData.widgetImages || [])];
                        newImages[idx] = e.target.value;
                        handleInputChange('widgetImages', newImages);
                      }}
                      placeholder="https://example.com/widget-image.png"
                      className="flex-1"
                    />
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700 px-2 py-1 rounded"
                      onClick={() => {
                        const newImages = [...(formData.widgetImages || [])];
                        newImages.splice(idx, 1);
                        // Ensure we always have at least one empty field
                        if (newImages.length === 0) {
                          newImages.push('');
                        }
                        handleInputChange('widgetImages', newImages);
                      }}
                    >
                      Remove
                    </button>
                    {img && <img src={img} alt="Widget" className="h-10 w-10 object-contain rounded" />}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleInputChange('widgetImages', [...(formData.widgetImages || []), ''])}
                >
                  Add Image
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Add one or more images to customize your widget (PNG, JPG, SVG URLs)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Voice Settings */}
        <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500 text-white rounded-lg flex items-center justify-center">
                <Volume2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Voice Settings</CardTitle>
                <CardDescription>
                  Enable text-to-speech for your bot responses
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">
                    Enable Voice Responses
                  </Label>
                  <p className="text-sm text-gray-600">
                    Allow your bot to speak its responses aloud
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="voiceEnabled"
                    checked={formData.voiceEnabled}
                    onChange={(e) => handleInputChange('voiceEnabled', e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <Label htmlFor="voiceEnabled" className="text-sm font-medium text-gray-700">
                    {formData.voiceEnabled ? 'Enabled' : 'Disabled'}
                  </Label>
                </div>
              </div>
            </div>

            {formData.voiceEnabled && (
              <>
                <div className="space-y-3">
                  <Label htmlFor="voice" className="text-sm font-semibold text-gray-700">
                    Voice Type
                  </Label>
                  <select
                    id="voice"
                    value={formData.voiceSettings.voice}
                    onChange={(e) => handleVoiceSettingsChange('voice', e.target.value as any)}
                    className="w-full h-12 border border-gray-200 rounded-lg px-3 focus:border-purple-300 focus:ring-purple-200"
                  >
                    <option value="alloy">Alloy - Balanced & Clear</option>
                    <option value="echo">Echo - Deep & Authoritative</option>
                    <option value="fable">Fable - Warm & Friendly</option>
                    <option value="onyx">Onyx - Professional & Calm</option>
                    <option value="nova">Nova - Energetic & Engaging</option>
                    <option value="shimmer">Shimmer - Soft & Gentle</option>
                  </select>
                  <p className="text-sm text-gray-600">
                    Choose the voice personality for your bot
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="speed" className="text-sm font-semibold text-gray-700">
                      Speed
                    </Label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="range"
                        id="speed"
                        min="0.25"
                        max="4.0"
                        step="0.25"
                        value={formData.voiceSettings.speed}
                        onChange={(e) => handleVoiceSettingsChange('speed', parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <span className="text-sm font-medium text-gray-700 w-12">
                        {formData.voiceSettings.speed}x
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="pitch" className="text-sm font-semibold text-gray-700">
                      Pitch
                    </Label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="range"
                        id="pitch"
                        min="0.25"
                        max="4.0"
                        step="0.25"
                        value={formData.voiceSettings.pitch}
                        onChange={(e) => handleVoiceSettingsChange('pitch', parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <span className="text-sm font-medium text-gray-700 w-12">
                        {formData.voiceSettings.pitch}x
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="language" className="text-sm font-semibold text-gray-700">
                    Language
                  </Label>
                  <select
                    id="language"
                    value={formData.voiceSettings.language}
                    onChange={(e) => handleVoiceSettingsChange('language', e.target.value)}
                    className="w-full h-12 border border-gray-200 rounded-lg px-3 focus:border-purple-300 focus:ring-purple-200"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                    <option value="de-DE">German</option>
                    <option value="it-IT">Italian</option>
                    <option value="pt-BR">Portuguese (Brazil)</option>
                    <option value="ja-JP">Japanese</option>
                    <option value="ko-KR">Korean</option>
                    <option value="zh-CN">Chinese (Simplified)</option>
                  </select>
                  <p className="text-sm text-gray-600">
                    Select the language for voice synthesis
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <Volume2 className="h-5 w-5 text-purple-600" />
                    <h4 className="font-semibold text-purple-900">Voice Preview</h4>
                  </div>
                  <p className="text-sm text-purple-700 mb-3">
                    Test how your bot will sound with the current settings
                  </p>
                  <Button
                    onClick={() => {
                      const voiceService = getVoiceService();
                      if (voiceService.isSpeechSupported()) {
                        voiceService.speak(
                          "Hello! This is how your bot will sound. I'm here to help you with any questions.",
                          formData.voiceSettings
                        );
                      }
                    }}
                    className="bg-purple-600 text-white hover:bg-purple-700 border-0"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Test Voice
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

// Add custom styles for the range sliders
const styles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #7c3aed;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #7c3aed;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .slider::-webkit-slider-track {
    background: #e5e7eb;
    height: 8px;
    border-radius: 4px;
  }

  .slider::-moz-range-track {
    background: #e5e7eb;
    height: 8px;
    border-radius: 4px;
    border: none;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
} 