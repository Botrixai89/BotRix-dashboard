'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Globe, Save, TestTube, ExternalLink, AlertCircle, Loader2, Palette, MessageCircle, ImagePlus, Building2, FileText } from 'lucide-react'
import { Loading } from '@/components/ui/loading'
import { showSuccess, showError } from '@/lib/toast'

interface Bot {
  _id: string
  name: string
  description?: string
  companyLogo?: string | null
  settings: {
    webhookUrl?: string
    fallbackMessage?: string
    welcomeMessage?: string
    primaryColor?: string
    headerColor?: string
    theme?: string
    widgetIconEmoji?: string
    logo?: string
    [key: string]: unknown
  }
}

const THEME_OPTIONS = [
  { value: 'modern', label: 'Modern' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'gradient', label: 'Gradient' },
]

export default function BotWebhookPage() {
  const params = useParams()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [bot, setBot] = useState<Bot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  // Client / brand info
  const [botName, setBotName] = useState('')
  const [botDescription, setBotDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  // Webhook
  const [webhookUrl, setWebhookUrl] = useState('')
  const [fallbackMessage, setFallbackMessage] = useState('')
  // UI / client customization
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [primaryColor, setPrimaryColor] = useState('')
  const [headerColor, setHeaderColor] = useState('')
  const [theme, setTheme] = useState('modern')
  const [widgetIconEmoji, setWidgetIconEmoji] = useState('')

  useEffect(() => {
    fetchBot()
  }, [params.id])

  const fetchBot = async () => {
    try {
      const res = await fetch(`/api/bots/${params.id}`)
      const data = await res.json()
      if (res.ok && data.bot) {
        setBot(data.bot)
        setBotName(data.bot.name || '')
        setBotDescription(data.bot.description || '')
        setLogoUrl(data.bot.companyLogo || data.bot.settings?.logo || null)
        const s = data.bot.settings || {}
        setWebhookUrl(s.webhookUrl || '')
        setFallbackMessage(s.fallbackMessage || "I'm sorry, I didn't understand that. Can you please rephrase?")
        setWelcomeMessage(s.welcomeMessage || 'Hello! How can I help you today?')
        setPrimaryColor(s.primaryColor || '#8b5cf6')
        setHeaderColor(s.headerColor || s.primaryColor || '#8b5cf6')
        setTheme(s.theme || 'modern')
        setWidgetIconEmoji(s.widgetIconEmoji || '💬')
      }
    } catch (e) {
      console.error(e)
      showError('Failed to load bot')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowed.includes(file.type)) {
      showError('Please use JPEG, PNG, GIF or WebP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showError('Image must be under 5MB.')
      return
    }
    setLogoUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok && data.url) {
        setLogoUrl(data.url)
        showSuccess('Logo uploaded')
      } else {
        showError(data.error || 'Upload failed')
      }
    } catch {
      showError('Upload failed')
    } finally {
      setLogoUploading(false)
    }
  }

  const handleSave = async () => {
    if (!params.id || !bot) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/bots/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: botName.trim() || bot.name,
          description: botDescription.trim(),
          companyLogo: logoUrl,
          settings: {
            ...bot.settings,
            webhookUrl: webhookUrl.trim(),
            fallbackMessage: fallbackMessage.trim() || "I'm sorry, I didn't understand that. Can you please rephrase?",
            welcomeMessage: welcomeMessage.trim() || 'Hello! How can I help you today?',
            primaryColor: primaryColor.trim() || '#8b5cf6',
            headerColor: headerColor.trim() || primaryColor.trim() || '#8b5cf6',
            theme: theme || 'modern',
            widgetIconEmoji: widgetIconEmoji.trim() || '💬',
            logo: logoUrl ?? null,
          },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.bot) setBot(data.bot)
        showSuccess('Webhook & appearance saved')
      } else {
        const err = await res.json()
        showError(err.error || 'Failed to save')
      }
    } catch (e) {
      showError('Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loading size="lg" text="Loading..." />
      </div>
    )
  }

  if (!bot) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">Bot not found</div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-gray-50 min-h-full overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Webhook & bot setup</h1>
          <p className="text-gray-600 mt-1">
            Configure your n8n webhook and how the chat widget looks and greets users. Everything you need per client in one place.
          </p>
        </div>

        {/* Client / brand info – logo, name, description */}
        <Card className="border border-gray-200 shadow-sm bg-white rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-slate-600" />
              Client / brand info
            </CardTitle>
            <CardDescription>
              Logo and key details for this bot. The logo appears in the chat header and in the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ImagePlus className="h-4 w-4" />
                Company / bot logo
              </Label>
              <div className="flex flex-wrap items-center gap-4">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleLogoChange}
                />
                {logoUrl ? (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="h-16 w-16 rounded-xl border border-gray-200 object-cover"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={logoUploading}
                      >
                        {logoUploading ? 'Uploading…' : 'Change'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setLogoUrl(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoUploading}
                  >
                    {logoUploading ? 'Uploading…' : 'Upload logo'}
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500">JPEG, PNG, GIF or WebP, max 5MB. Shown in the chat widget header.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bot-name" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Bot name
              </Label>
              <Input
                id="bot-name"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                placeholder="e.g. Acme Support Bot"
                className="max-w-md"
              />
              <p className="text-xs text-gray-500">Display name for this bot (dashboard and embed).</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bot-desc">Short description</Label>
              <Textarea
                id="bot-desc"
                value={botDescription}
                onChange={(e) => setBotDescription(e.target.value)}
                placeholder="e.g. Customer support for Acme Inc."
                rows={2}
                className="resize-none max-w-md"
              />
              <p className="text-xs text-gray-500">Optional. Used in the dashboard and when sharing the bot.</p>
            </div>
          </CardContent>
        </Card>

        {/* Webhook */}
        <Card className="border border-gray-200 shadow-sm bg-white rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5 text-indigo-500" />
              n8n webhook URL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://n8n.srv.../webhook/4a56cd36-.../chat"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fallback">Fallback message (when webhook fails or is empty)</Label>
              <Textarea
                id="fallback"
                value={fallbackMessage}
                onChange={(e) => setFallbackMessage(e.target.value)}
                placeholder="I'm sorry, I didn't understand that."
                rows={2}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bot appearance & behavior (client customization) */}
        <Card className="mt-6 border border-gray-200 shadow-sm bg-white rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="h-5 w-5 text-teal-500" />
              Bot appearance & behavior
            </CardTitle>
            <CardDescription>
              Customize the chat widget for this client: first message, colors, and theme.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="welcome" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Welcome message
              </Label>
              <Textarea
                id="welcome"
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="Hello! How can I help you today?"
                rows={2}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">Shown when the user opens the chat.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded border border-gray-200 cursor-pointer p-0"
                  />
                  <Input
                    id="primary-color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#8b5cf6"
                    className="font-mono flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500">Buttons, accents, link color.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="header-color">Header color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={headerColor}
                    onChange={(e) => setHeaderColor(e.target.value)}
                    className="w-10 h-10 rounded border border-gray-200 cursor-pointer p-0"
                  />
                  <Input
                    id="header-color"
                    value={headerColor}
                    onChange={(e) => setHeaderColor(e.target.value)}
                    placeholder="#8b5cf6"
                    className="font-mono flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500">Chat header bar. Leave same as primary to match.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THEME_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emoji">Widget icon (emoji)</Label>
              <Input
                id="emoji"
                value={widgetIconEmoji}
                onChange={(e) => setWidgetIconEmoji(e.target.value)}
                placeholder="💬"
                maxLength={4}
                className="w-20 text-2xl text-center"
              />
              <p className="text-xs text-gray-500">Emoji shown on the floating chat button.</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save all
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(`/test-widget.html?botId=${params.id}`, '_blank')}
          >
            <TestTube className="h-4 w-4 mr-2" />
            Test widget
          </Button>
          {webhookUrl && (
            <Button variant="ghost" size="sm" onClick={() => window.open(webhookUrl, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open webhook URL
            </Button>
          )}
        </div>

        {/* Payload reference */}
        <Card className="mt-6 border border-amber-200 bg-amber-50/50 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-amber-800">
              <AlertCircle className="h-4 w-4" />
              Payload your n8n workflow receives
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
{`{
  "action": "sendMessage",
  "sessionId": "widget_<botId>_<conversationId>",
  "message": "<user message>",
  "chatInput": "<user message>",
  "conversationId": "<id>",
  "botId": "<id>",
  "userInfo": { "name", "email", "ip", "userAgent" },
  "timestamp": "<ISO date>"
}`}
            </pre>
            <p className="mt-2 text-gray-600">
              Respond with JSON: <code className="bg-white px-1 rounded border">{"{ \"output\": \"Your reply text\" }"}</code> or <code className="bg-white px-1 rounded border">{"{ \"message\": \"Your reply text\" }"}</code>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
