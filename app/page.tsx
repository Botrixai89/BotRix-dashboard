'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageLoading } from '@/components/ui/loading'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to login page
    router.push('/login')
  }, [router])

  // Show loading while redirecting
  return <PageLoading />
} 