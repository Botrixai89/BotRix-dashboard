'use client'

import { useEffect, useState } from 'react'
import { Loading } from '@/components/ui/loading'

export default function HealthPage() {
  const [health, setHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health')
        const data = await response.json()
        setHealth(data)
      } catch (error) {
        console.error('Health check error:', error)
        setHealth({ error: 'Failed to check health' })
      } finally {
        setLoading(false)
      }
    }

    checkHealth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="Checking health..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Health Check</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <pre className="whitespace-pre-wrap text-sm">
          {JSON.stringify(health, null, 2)}
        </pre>
      </div>
    </div>
  )
} 