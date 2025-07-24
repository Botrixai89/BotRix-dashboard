'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Bot, Sparkles, Zap, Settings, Palette } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { showSuccess, showError, toastMessages } from '@/lib/toast'
import { useRef } from 'react';

export default function CreateBotPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#7c3aed')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data.url) {
        setLogoUrl(data.url)
      } else {
        setError(data.error || 'Failed to upload logo')
      }
    } catch (err) {
      setError('Failed to upload logo')
    } finally {
      setLogoUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('botName') as string,
      description: formData.get('botDescription') as string,
      welcomeMessage: formData.get('welcomeMessage') as string,
      primaryColor: primaryColor,
      webhookUrl: formData.get('webhookUrl') as string,
      companyLogo: logoUrl,
    }

    try {
      const response = await fetch('/api/bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        // Success! Show toast and redirect to the new bot's page
        showSuccess(toastMessages.botCreated)
        setTimeout(() => {
          router.push(`/dashboard/bots/${result.bot._id}`)
        }, 1000)
      } else {
        setError(result.error || 'Failed to create bot')
        showError(result.error || 'Failed to create bot')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      showError(toastMessages.networkError)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 hero-pattern opacity-30"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-8 py-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="hover:bg-purple-50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Bot</h1>
              <p className="text-gray-600 mt-1">Set up your intelligent chatbot in minutes</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-4xl mx-auto p-8 space-y-8">
          {/* Main Form Card */}
          <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl gradient-primary">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Bot Configuration</CardTitle>
                  <CardDescription className="text-gray-600">
                    Configure your bot's basic settings and personality
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
              )}

              <form className="space-y-8" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Logo Upload */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center">
                        Company Logo
                      </Label>
                      <div className="flex items-center space-x-4">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoChange}
                        />
                        <Button type="button" variant="outline" onClick={() => logoInputRef.current?.click()} disabled={logoUploading}>
                          {logoUploading ? 'Uploading...' : 'Upload Logo'}
                        </Button>
                        {logoUrl && (
                          <img src={logoUrl} alt="Logo Preview" className="w-12 h-12 rounded-lg object-cover border" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">This logo will appear next to your bot name in the dashboard.</p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="botName" className="text-sm font-semibold text-gray-700 flex items-center">
                        <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                        Bot Name *
                      </Label>
                      <Input
                        id="botName"
                        name="botName"
                        type="text"
                        placeholder="e.g., Customer Support Bot"
                        className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        required
                      />
                      <p className="text-sm text-gray-500">
                        This will be visible to your website visitors
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="botDescription" className="text-sm font-semibold text-gray-700">
                        Description
                      </Label>
                      <Input
                        id="botDescription"
                        name="botDescription"
                        type="text"
                        placeholder="Brief description of what your bot does"
                        className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                      />
                      <p className="text-sm text-gray-500">
                        Help your team understand the bot's purpose
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="welcomeMessage" className="text-sm font-semibold text-gray-700 flex items-center">
                        <Zap className="w-4 h-4 mr-2 text-blue-500" />
                        Welcome Message *
                      </Label>
                      <Input
                        id="welcomeMessage"
                        name="welcomeMessage"
                        type="text"
                        placeholder="Hello! How can I help you today?"
                        defaultValue="Hello! How can I help you today?"
                        className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        required
                      />
                      <p className="text-sm text-gray-500">
                        The first message visitors will see
                      </p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="primaryColor" className="text-sm font-semibold text-gray-700 flex items-center">
                        <Palette className="w-4 h-4 mr-2 text-pink-500" />
                        Primary Color
                      </Label>
                      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                        <input
                          id="primaryColor"
                          name="primaryColor"
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-16 h-12 rounded-lg border-2 border-white shadow-lg cursor-pointer"
                        />
                        <div className="flex-1">
                          <Input
                            type="text"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                            placeholder="#7c3aed"
                          />
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">
                        This color will be used for the chat widget header
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="webhookUrl" className="text-sm font-semibold text-gray-700 flex items-center">
                        <Settings className="w-4 h-4 mr-2 text-green-500" />
                        Webhook URL *
                      </Label>
                      <Input
                        id="webhookUrl"
                        name="webhookUrl"
                        type="url"
                        defaultValue="https://automation.botrixai.com/webhook/8b0df4ab-cb69-48d7-b3f4-d8a68a420ef8/chat"
                        placeholder="https://automation.botrixai.com/webhook/your-webhook-id/chat"
                        className="h-12 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                        required
                      />
                      <p className="text-sm text-gray-500">
                        Your automation webhook URL for processing bot conversations
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <Link href="/dashboard">
                    <Button variant="outline" type="button" className="px-8 py-3 border-purple-200 text-purple-600 hover:bg-purple-50">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={isLoading} className="gradient-primary text-white border-0 px-8 py-3 hover:shadow-lg hover:scale-105 transition-all">
                    {isLoading ? 'Creating Bot...' : 'Create Bot'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Next Steps Preview */}
          <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
                What's Next?
              </CardTitle>
              <CardDescription>
                After creating your bot, you'll be able to:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center mr-3 text-sm font-bold">1</div>
                    <div>
                      <div className="font-medium text-gray-900">Configure Responses</div>
                      <div className="text-sm text-gray-600">Set up conversation flows</div>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center mr-3 text-sm font-bold">2</div>
                    <div>
                      <div className="font-medium text-gray-900">Customize Widget</div>
                      <div className="text-sm text-gray-600">Match your brand style</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-500 text-white rounded-lg flex items-center justify-center mr-3 text-sm font-bold">3</div>
                    <div>
                      <div className="font-medium text-gray-900">Get Embed Code</div>
                      <div className="text-sm text-gray-600">Add to your website</div>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-orange-50 rounded-lg">
                    <div className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center mr-3 text-sm font-bold">4</div>
                    <div>
                      <div className="font-medium text-gray-900">Monitor & Optimize</div>
                      <div className="text-sm text-gray-600">Track performance</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
} 