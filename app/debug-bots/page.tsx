'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugBotsPage() {
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchDebugData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/bots', {
        credentials: 'include'
      })
      const data = await response.json()
      setDebugData(data)
    } catch (error) {
      console.error('Error fetching debug data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugData()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Debug Bots Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchDebugData} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh Debug Data'}
            </Button>
            
            {debugData && (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{debugData.totalBots}</div>
                    <div className="text-sm text-blue-600">Total Bots</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{debugData.userBots}</div>
                    <div className="text-sm text-green-600">Your Bots</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{debugData.currentUserId ? 'Yes' : 'No'}</div>
                    <div className="text-sm text-purple-600">Authenticated</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Current User ID:</h3>
                  <code className="bg-gray-100 p-2 rounded text-sm block">
                    {debugData.currentUserId || 'Not authenticated'}
                  </code>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">All Bots in Database:</h3>
                  <div className="space-y-2">
                    {debugData.allBots.map((bot: any, index: number) => (
                      <div key={index} className={`p-3 rounded border ${bot.isCurrentUser ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <strong>{bot.name}</strong>
                            <div className="text-sm text-gray-600">ID: {bot._id}</div>
                            <div className="text-sm text-gray-600">User ID: {bot.userId}</div>
                            <div className="text-sm text-gray-600">Created: {new Date(bot.createdAt).toLocaleString()}</div>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs ${bot.isCurrentUser ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                            {bot.isCurrentUser ? 'Yours' : 'Other User'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 