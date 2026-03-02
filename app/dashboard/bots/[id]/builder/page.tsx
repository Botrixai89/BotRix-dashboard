'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

/**
 * Builder is deprecated; bot logic is now handled via n8n webhook.
 * Redirect to the Webhook config page.
 */
export default function BuilderRedirectPage() {
  const params = useParams()
  const router = useRouter()

  useEffect(() => {
    router.replace(`/dashboard/bots/${params.id}/webhook`)
  }, [params.id, router])

  return (
    <div className="flex items-center justify-center h-full text-gray-500">
      Redirecting to webhook settings…
    </div>
  )
}
