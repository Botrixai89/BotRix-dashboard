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
  const [primaryColor, setPrimaryColor] = useState('#10b981')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoLoading, setLogoLoading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    console.log('Logo upload started:', { name: file.name, type: file.type, size: file.size })
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
      
      console.log('Upload response:', { status: res.status, data })
      
      if (res.ok && data.url) {
        console.log('Logo uploaded successfully:', data.url)
        setLogoLoading(true)
        setLogoUrl(data.url)
      } else {
        console.error('Upload failed:', data.error)
        setError(data.error || 'Failed to upload logo')
      }
    } catch (err) {
      console.error('Upload error:', err)
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
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 sm:py-6 shadow-sm">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="hover:bg-green-50 p-2 sm:p-2 min-w-[40px] min-h-[40px] rounded-lg">
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 truncate">Create New Bot</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Set up your intelligent chatbot in minutes</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6 sm:space-y-8">
          {/* Main Form Card */}
          <Card className="border-0 shadow-xl card-glow bg-white rounded-xl">
            <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6 pt-6">
              <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
                <div className="p-2 sm:p-3 rounded-xl bg-green-600 flex-shrink-0">
                  <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg sm:text-2xl font-bold">Bot Configuration</CardTitle>
                  <CardDescription className="text-gray-600 text-sm sm:text-base mt-1">
                    Configure your bot's basic settings and personality
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-6">
              {error && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
              )}

              <form className="space-y-6 sm:space-y-8" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {/* Left Column */}
                  <div className="space-y-5 sm:space-y-6">
                    {/* Logo Upload */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center">
                        Company Logo
                      </Label>
                      <div className="flex items-center space-x-3 sm:space-x-4">
                         <input
                           ref={logoInputRef}
                           type="file"
                           accept="image/*"
                           className="hidden"
                           onChange={handleLogoChange}
                         />
                         <Button 
                           type="button" 
                           variant="outline" 
                           onClick={() => logoInputRef.current?.click()} 
                           disabled={logoUploading}
                           className="py-2.5 px-4 h-auto text-sm font-medium rounded-lg min-h-[44px]"
                         >
                            {logoUploading ? 'Uploading...' : 'Upload Logo'}
                          </Button>

                         <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg border border-gray-200 overflow-hidden relative bg-white flex-shrink-0">
                           {logoUrl ? (
                             <>
                               {logoLoading && (
                                 <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                                   <span className="text-gray-400 text-xs">Loading...</span>
                                 </div>
                               )}
                               <img 
                                 src={logoUrl} 
                                 alt="Logo Preview" 
                                 className="w-full h-full object-cover"
                                 style={{ 
                                   display: logoLoading ? 'none' : 'block',
                                   maxWidth: '100%',
                                   maxHeight: '100%'
                                 }}
                                 onLoad={() => {
                                   console.log('Image loaded successfully:', logoUrl);
                                   setLogoLoading(false);
                                 }}
                                 onError={(e) => {
                                   console.error('Failed to load image:', logoUrl);
                                   setLogoLoading(false);
                                   // Show error but keep the URL for retry
                                   setError('Failed to load uploaded image. The image may still be processing. You can try refreshing or uploading again.');
                                 }}
                               />
                             </>
                           ) : (
                             <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                               <span className="text-gray-400 text-xs">Logo</span>
                             </div>
                           )}
                         </div>
                       </div>
                                             <p className="text-sm text-gray-500">This logo will appear next to your bot name in the dashboard.</p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="botName" className="text-sm font-semibold text-gray-700 flex items-center">
                        <Sparkles className="w-4 h-4 mr-2 text-green-500" />
                        Bot Name *
                      </Label>
                      <Input
                        id="botName"
                        name="botName"
                        type="text"
                        placeholder="e.g., Customer Support Bot"
                        className="h-12 sm:h-12 border-gray-200 focus:border-green-300 focus:ring-green-200 text-base rounded-lg px-4"
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
                        className="h-12 sm:h-12 border-gray-200 focus:border-green-300 focus:ring-green-200 text-base rounded-lg px-4"
                      />
                      <p className="text-sm text-gray-500">
                        Help your team understand the bot's purpose
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="welcomeMessage" className="text-sm font-semibold text-gray-700 flex items-center">
                        <Zap className="w-4 h-4 mr-2 text-green-500" />
                        Welcome Message *
                      </Label>
                      <Input
                        id="welcomeMessage"
                        name="welcomeMessage"
                        type="text"
                        placeholder="Hello! How can I help you today?"
                        defaultValue="Hello! How can I help you today?"
                        className="h-12 sm:h-12 border-gray-200 focus:border-green-300 focus:ring-green-200 text-base rounded-lg px-4"
                        required
                      />
                      <p className="text-sm text-gray-500">
                        The first message visitors will see
                      </p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-5 sm:space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="primaryColor" className="text-sm font-semibold text-gray-700 flex items-center">
                        <Palette className="w-4 h-4 mr-2 text-green-500" />
                        Primary Color
                      </Label>
                      <div className="flex items-center space-x-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                        <input
                          id="primaryColor"
                          name="primaryColor"
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-12 h-12 sm:w-16 sm:h-12 rounded-lg border-2 border-white shadow-lg cursor-pointer flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <Input
                            type="text"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="h-12 sm:h-12 border-gray-200 focus:border-green-300 focus:ring-green-200 text-base rounded-lg px-4"
                            placeholder="#10b981"
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
                        placeholder="https://your-automation.com/webhook/your-webhook-id"
                        className="h-12 sm:h-12 border-gray-200 focus:border-green-300 focus:ring-green-200 text-base rounded-lg px-4"
                      />
                      <p className="text-sm text-gray-500">
                        Your automation webhook URL for processing bot conversations. You can change this to use a different webhook if needed.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
                  <Link href="/dashboard" className="order-2 sm:order-1">
                    <Button 
                      variant="outline" 
                      type="button" 
                      className="w-full sm:w-auto px-6 sm:px-8 py-3 border-green-200 text-green-600 hover:bg-green-50 rounded-lg font-medium min-h-[48px]"
                    >
                      Cancel
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="order-1 sm:order-2 w-full sm:w-auto bg-green-600 text-white border-0 px-6 sm:px-8 py-3 hover:bg-green-700 hover:shadow-lg transition-all rounded-lg font-medium min-h-[48px]"
                  >
                    {isLoading ? 'Creating Bot...' : 'Create Bot'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Next Steps Preview */}
          <Card className="border-0 shadow-lg bg-white rounded-xl">
            <CardHeader className="px-4 sm:px-6 pb-4">
              <CardTitle className="text-lg sm:text-xl flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" />
                What's Next?
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                After creating your bot, you'll be able to:
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-3">
                  <div className="flex items-start sm:items-center p-3 sm:p-4 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center mr-3 text-sm font-bold flex-shrink-0">1</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 text-sm sm:text-base">Configure Responses</div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1">Set up conversation flows</div>
                    </div>
                  </div>
                  <div className="flex items-start sm:items-center p-3 sm:p-4 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center mr-3 text-sm font-bold flex-shrink-0">2</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 text-sm sm:text-base">Customize Widget</div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1">Match your brand style</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start sm:items-center p-3 sm:p-4 bg-emerald-50 rounded-lg">
                    <div className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center mr-3 text-sm font-bold flex-shrink-0">3</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 text-sm sm:text-base">Get Embed Code</div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1">Add to your website</div>
                    </div>
                  </div>
                  <div className="flex items-start sm:items-center p-3 sm:p-4 bg-teal-50 rounded-lg">
                    <div className="w-8 h-8 bg-teal-500 text-white rounded-lg flex items-center justify-center mr-3 text-sm font-bold flex-shrink-0">4</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 text-sm sm:text-base">Monitor & Optimize</div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1">Track performance</div>
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