'use client'

import { useState } from 'react'
import { Loading, PageLoading, Spinner, ButtonLoading } from '@/components/ui/loading'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoadingDemoPage() {
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [buttonLoading, setButtonLoading] = useState(false)

  const handleButtonClick = () => {
    setButtonLoading(true)
    setTimeout(() => setButtonLoading(false), 2000)
  }

  if (showFullscreen) {
    return <PageLoading />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Loading Components Demo</h1>
          <p className="text-gray-600 text-lg">Clean and sober loading UI components</p>
        </div>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>Fullscreen Loading</CardTitle>
            <CardDescription>Full-screen loading experience</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowFullscreen(true)}>Try Fullscreen</Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle>Default Loading</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Loading size="sm" text="Loading..." />
              <Loading size="md" text="Processing..." />
              <Loading size="lg" text="Please wait..." />
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle>Minimal Spinner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <span>Small:</span>
                <Spinner size="sm" />
              </div>
              <div className="flex items-center space-x-4">
                <span>Medium:</span>
                <Spinner size="md" />
              </div>
              <div className="flex items-center space-x-4">
                <span>Large:</span>
                <Spinner size="lg" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>Button Loading</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleButtonClick} disabled={buttonLoading}>
              {buttonLoading ? (
                <>
                  <ButtonLoading size="sm" />
                  <span className="ml-2">Processing...</span>
                </>
              ) : (
                'Click to Test Loading'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
