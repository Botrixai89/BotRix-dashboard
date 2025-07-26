'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { TestTube, AlertTriangle, CheckCircle, XCircle, Send, RefreshCw, Bug, Info } from 'lucide-react'
import { useState } from 'react'

export default function DebugWebhookPage() {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [testMessage, setTestMessage] = useState('okay')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [directResult, setDirectResult] = useState<any>(null)

  const testWebhook = async () => {
    setIsLoading(true)
    setResult(null)
    setDirectResult(null)

    try {
      // Test 1: Use our debug API
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

      // Test 2: Direct webhook call to compare
      try {
        const directResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: "text",
            content: {
              text: testMessage
            }
        }),
      })

        const directData = await directResponse.text()
        let parsedDirectData
        try {
          parsedDirectData = JSON.parse(directData)
        } catch (e) {
          parsedDirectData = { rawResponse: directData }
        }

        setDirectResult({
          success: directResponse.ok,
          status: directResponse.status,
          statusText: directResponse.statusText,
          response: parsedDirectData,
          headers: Object.fromEntries(directResponse.headers.entries())
        })
      } catch (directError: unknown) {
        const errorMessage = directError instanceof Error ? directError.message : String(directError);
        setDirectResult({
          success: false,
          error: errorMessage,
          message: 'Direct webhook call failed'
        })
      }

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
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Bug className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Webhook Debug Tool</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Debug your webhook by comparing direct calls vs. our API calls. 
            This helps identify if the issue is with our API or your webhook configuration.
          </p>
        </div>

        {/* Test Form */}
        <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TestTube className="h-5 w-5" />
              <span>Debug Webhook Configuration</span>
            </CardTitle>
            <CardDescription>
              Test the same webhook URL that the working bot uses to identify the issue
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
                  Debug Webhook
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* API Test Results */}
          <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    {getStatusIcon(result.success)}
                    <span>Via Our API</span>
                  </CardTitle>
                  {getStatusBadge(result.success)}
                </div>
                <CardDescription>
                  Test through our chat API (same as your bot)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Response Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-2">Status Code:</div>
                      <div className="font-mono text-lg">
                        {result.status || 'N/A'}
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

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Analysis</h4>
                  <div className="space-y-2">
                    {result.success ? (
                      <div className="flex items-center space-x-2 text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        <span>API call successful</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-red-700">
                        <XCircle className="h-4 w-4" />
                        <span>API call failed: {result.error || 'Unknown error'}</span>
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

            {/* Direct Test Results */}
            <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    {getStatusIcon(directResult?.success)}
                    <span>Direct Call</span>
                  </CardTitle>
                  {directResult && getStatusBadge(directResult.success)}
                </div>
                <CardDescription>
                  Direct webhook call (bypassing our API)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {directResult ? (
                  <>
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Response Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600 mb-2">Status Code:</div>
                          <div className="font-mono text-lg">
                            {directResult.status || 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-2">Response Body:</div>
                        <pre className="text-xs bg-white p-3 rounded border overflow-x-auto max-h-64">
                          {JSON.stringify(directResult.response, null, 2)}
                        </pre>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Analysis</h4>
                      <div className="space-y-2">
                        {directResult.success ? (
                          <div className="flex items-center space-x-2 text-green-700">
                            <CheckCircle className="h-4 w-4" />
                            <span>Direct call successful</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 text-red-700">
                            <XCircle className="h-4 w-4" />
                            <span>Direct call failed: {directResult.error || 'Unknown error'}</span>
                          </div>
                        )}
                        
                        {directResult.response && directResult.response.content && directResult.response.content.text ? (
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
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Info className="h-8 w-8 mx-auto mb-2" />
                    <p>Direct test results will appear here after testing</p>
                  </div>
                )}
              </CardContent>
            </Card>
              </div>
        )}

        {/* Comparison Analysis */}
        {result && directResult && (
          <Card className="border-0 shadow-xl card-glow bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Comparison Analysis</CardTitle>
              <CardDescription>
                Compare the results to identify where the issue occurs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Status Codes</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Via API:</span>
                      <Badge variant={result.success ? 'default' : 'secondary'}>
                        {result.status || 'N/A'}
                      </Badge>
                </div>
                    <div className="flex justify-between">
                      <span>Direct:</span>
                      <Badge variant={directResult.success ? 'default' : 'secondary'}>
                        {directResult.status || 'N/A'}
                  </Badge>
                </div>
              </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Success Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Via API:</span>
                      <Badge variant={result.success ? 'default' : 'secondary'}>
                        {result.success ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Direct:</span>
                      <Badge variant={directResult.success ? 'default' : 'secondary'}>
                        {directResult.success ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                  </div>
              </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Response Format</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Via API:</span>
                      <Badge variant={
                        result.response && result.response.content && result.response.content.text 
                          ? 'default' : 'secondary'
                      }>
                        {result.response && result.response.content && result.response.content.text 
                          ? 'Valid' : 'Invalid'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Direct:</span>
                      <Badge variant={
                        directResult.response && directResult.response.content && directResult.response.content.text 
                          ? 'default' : 'secondary'
                      }>
                        {directResult.response && directResult.response.content && directResult.response.content.text 
                          ? 'Valid' : 'Invalid'}
                      </Badge>
                  </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Troubleshooting Guide</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  {result.success && directResult.success ? (
                    <p>✅ Both tests successful - the issue might be in your bot configuration or workflow logic</p>
                  ) : !result.success && directResult.success ? (
                    <p>⚠️ Direct call works but API call fails - there's an issue with our API implementation</p>
                  ) : result.success && !directResult.success ? (
                    <p>⚠️ API call works but direct call fails - there might be authentication or CORS issues</p>
                  ) : (
                    <p>❌ Both tests failed - the webhook URL or workflow has issues</p>
                  )}
                  
                  {result.status === 500 && (
                    <p>🔍 Status 500 indicates a server-side error in your workflow</p>
                  )}
                  
                  {result.status === 404 && (
                    <p>🔍 Status 404 indicates the webhook URL is incorrect or the workflow is not published</p>
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