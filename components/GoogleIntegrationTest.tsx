'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { showSuccess, showError } from '@/lib/toast'

interface TestResult {
  success: boolean
  data?: any
  error?: string
}

export default function GoogleIntegrationTest() {
  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, TestResult>>({})

  // Analytics Test
  const testAnalytics = async () => {
    setLoading('analytics')
    try {
      const response = await fetch('/api/integrations/google/analytics?action=data&viewId=ga:123456789&startDate=7daysAgo&endDate=today')
      const data = await response.json()
      
      if (data.data) {
        setResults(prev => ({ ...prev, analytics: { success: true, data: data.data } }))
        showSuccess('Analytics data retrieved successfully!')
      } else {
        setResults(prev => ({ ...prev, analytics: { success: false, error: data.error } }))
        showError('Failed to get analytics data')
      }
    } catch (error) {
      setResults(prev => ({ ...prev, analytics: { success: false, error: 'Network error' } }))
      showError('Analytics test failed')
    } finally {
      setLoading(null)
    }
  }

  // Calendar Test
  const testCalendar = async () => {
    setLoading('calendar')
    try {
      const response = await fetch('/api/integrations/google/calendar?action=events&maxResults=5')
      const data = await response.json()
      
      if (data.events) {
        setResults(prev => ({ ...prev, calendar: { success: true, data: data.events } }))
        showSuccess('Calendar events retrieved successfully!')
      } else {
        setResults(prev => ({ ...prev, calendar: { success: false, error: data.error } }))
        showError('Failed to get calendar events')
      }
    } catch (error) {
      setResults(prev => ({ ...prev, calendar: { success: false, error: 'Network error' } }))
      showError('Calendar test failed')
    } finally {
      setLoading(null)
    }
  }

  // Sheets Test
  const testSheets = async () => {
    setLoading('sheets')
    try {
      const response = await fetch('/api/integrations/google/sheets?action=read&spreadsheetId=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms&range=A1:A5')
      const data = await response.json()
      
      if (data.data) {
        setResults(prev => ({ ...prev, sheets: { success: true, data: data.data } }))
        showSuccess('Sheets data retrieved successfully!')
      } else {
        setResults(prev => ({ ...prev, sheets: { success: false, error: data.error } }))
        showError('Failed to get sheets data')
      }
    } catch (error) {
      setResults(prev => ({ ...prev, sheets: { success: false, error: 'Network error' } }))
      showError('Sheets test failed')
    } finally {
      setLoading(null)
    }
  }

  // Translate Test
  const [translateText, setTranslateText] = useState('Hello, how are you?')
  const [targetLanguage, setTargetLanguage] = useState('es')

  const testTranslate = async () => {
    setLoading('translate')
    try {
      const response = await fetch('/api/integrations/google/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'translate',
          text: translateText,
          targetLanguage,
          sourceLanguage: 'en'
        })
      })
      const data = await response.json()
      
      if (data.result) {
        setResults(prev => ({ ...prev, translate: { success: true, data: data.result } }))
        showSuccess('Translation completed successfully!')
      } else {
        setResults(prev => ({ ...prev, translate: { success: false, error: data.error } }))
        showError('Failed to translate text')
      }
    } catch (error) {
      setResults(prev => ({ ...prev, translate: { success: false, error: 'Network error' } }))
      showError('Translation test failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Google Integration Tests</h2>
        <p className="text-gray-600">Test the Google Cloud integrations functionality</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Analytics Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              📊 Google Analytics Test
            </CardTitle>
            <CardDescription>
              Test analytics data retrieval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testAnalytics}
              disabled={loading === 'analytics'}
              className="w-full"
            >
              {loading === 'analytics' ? 'Testing...' : 'Test Analytics'}
            </Button>
            
            {results.analytics && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Result:</h4>
                {results.analytics.success ? (
                  <pre className="text-sm text-green-600 overflow-auto">
                    {JSON.stringify(results.analytics.data, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-red-600">{results.analytics.error}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendar Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              📅 Google Calendar Test
            </CardTitle>
            <CardDescription>
              Test calendar events retrieval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testCalendar}
              disabled={loading === 'calendar'}
              className="w-full"
            >
              {loading === 'calendar' ? 'Testing...' : 'Test Calendar'}
            </Button>
            
            {results.calendar && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Result:</h4>
                {results.calendar.success ? (
                  <pre className="text-sm text-green-600 overflow-auto">
                    {JSON.stringify(results.calendar.data, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-red-600">{results.calendar.error}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sheets Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              📈 Google Sheets Test
            </CardTitle>
            <CardDescription>
              Test sheets data reading
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testSheets}
              disabled={loading === 'sheets'}
              className="w-full"
            >
              {loading === 'sheets' ? 'Testing...' : 'Test Sheets'}
            </Button>
            
            {results.sheets && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Result:</h4>
                {results.sheets.success ? (
                  <pre className="text-sm text-green-600 overflow-auto">
                    {JSON.stringify(results.sheets.data, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-red-600">{results.sheets.error}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Translate Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              🌐 Google Translate Test
            </CardTitle>
            <CardDescription>
              Test text translation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="translate-text">Text to translate:</Label>
              <Input
                id="translate-text"
                value={translateText}
                onChange={(e) => setTranslateText(e.target.value)}
                placeholder="Enter text to translate"
              />
            </div>
            
            <div>
              <Label htmlFor="target-language">Target language:</Label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="ko">Korean</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={testTranslate}
              disabled={loading === 'translate'}
              className="w-full"
            >
              {loading === 'translate' ? 'Translating...' : 'Test Translation'}
            </Button>
            
            {results.translate && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Result:</h4>
                {results.translate.success ? (
                  <div className="text-sm text-green-600">
                    <p><strong>Translated:</strong> {results.translate.data.translatedText}</p>
                    {results.translate.data.detectedSourceLanguage && (
                      <p><strong>Detected Language:</strong> {results.translate.data.detectedSourceLanguage}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-red-600">{results.translate.error}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>Note: These tests require the respective Google integrations to be connected.</p>
        <p>Go to <a href="/dashboard/integrations" className="text-blue-600 hover:underline">Integrations</a> to set up your connections.</p>
      </div>
    </div>
  )
}
