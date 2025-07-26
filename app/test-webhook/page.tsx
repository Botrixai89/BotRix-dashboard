'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { TestTube, AlertTriangle, CheckCircle, XCircle, Send, RefreshCw } from 'lucide-react'
import { useState } from 'react'

export default function TestWebhookPage() {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [testMessage, setTestMessage] = useState('okay')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testWebhook = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/debug/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhookUrl,
          testMessage,
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setResult({
        success: false,
        error: errorMessage,
        message: 'Failed to test webhook'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (success: boolean) => {
    if (success) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }
    return <XCircle className="h-5 w-5 text-red-500" />
  }

  const getStatusBadge = (success: boolean) => {
    if (success) {
      return <Badge className="bg-green-100 text-green-800">Success</Badge>
    }
    return <Badge className="bg-red-100 text-red-800">Failed</Badge>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <TestTube className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Webhook Tester</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Test your webhook with the exact payload format used by the working bot. 
            This helps ensure your webhook responds correctly to the same format.
          </p>
        </div>

        {/* Test Form */}
        <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TestTube className="h-5 w-5" />
              <span>Test Webhook Configuration</span>
            </CardTitle>
            <CardDescription>
              Enter your webhook URL and test message to verify the payload format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input
                id="webhookUrl"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-automation.com/webhook/your-webhook-id"
                className="font-mono text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="testMessage">Test Message</Label>
              <Input
                id="testMessage"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter a test message"
              />
            </div>

            <Button 
              onClick={testWebhook} 
              disabled={isLoading || !webhookUrl || !testMessage}
                              className="w-full bg-teal-600 text-white border-0 hover:bg-teal-700"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Test Webhook
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  {getStatusIcon(result.success)}
                  <span>Test Results</span>
                </CardTitle>
                {getStatusBadge(result.success)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Request Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Request Details</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Payload Sent:</div>
                  <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                    {JSON.stringify({
                      type: "text",
                      content: {
                        text: testMessage
                      }
                    }, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Response Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Response Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Status Code:</div>
                    <div className="font-mono text-lg">
                      {result.status || 'N/A'}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Response Time:</div>
                    <div className="font-mono text-lg">
                      {result.responseTime || 'N/A'}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Response Body:</div>
                  <pre className="text-xs bg-white p-3 rounded border overflow-x-auto max-h-64">
                    {JSON.stringify(result.response, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Analysis */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Analysis</h4>
                <div className="space-y-2">
                  {result.success ? (
                    <div className="flex items-center space-x-2 text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      <span>Webhook responded successfully with status {result.status}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-red-700">
                      <XCircle className="h-4 w-4" />
                      <span>Webhook failed: {result.error || 'Unknown error'}</span>
                    </div>
                  )}
                  
                  {result.response && result.response.content && result.response.content.text ? (
                    <div className="flex items-center space-x-2 text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      <span>Response format matches expected structure</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-yellow-700">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Response format may not match expected structure</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Expected Payload Format</CardTitle>
            <CardDescription>
              Your webhook should expect and respond with this exact format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Request Payload (What we send)</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`{
  "type": "text",
  "content": {
    "text": "your message here"
  }
}`}
                </pre>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Expected Response Format</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`{
  "content": {
    "text": "Your bot response here",
    "_id": "unique-message-id",
    "sender": "bot",
    "type": "text",
    "createdAt": "2025-01-16T15:19:43.893Z"
  }
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 