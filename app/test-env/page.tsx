'use client'

import { useEffect, useState } from 'react'

export default function TestEnvPage() {
  const [envVars, setEnvVars] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkEnv = async () => {
      try {
        const response = await fetch('/api/test-env')
        const data = await response.json()
        setEnvVars(data)
      } catch (error) {
        console.error('Error checking environment:', error)
        setEnvVars({ error: 'Failed to check environment' })
      } finally {
        setLoading(false)
      }
    }

    checkEnv()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading environment check...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Environment Variables Test</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <pre className="whitespace-pre-wrap text-sm">
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </div>
    </div>
  )
} 