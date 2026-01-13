'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard immediately
    router.replace('/dashboard')
  }, [router])

  // Show loading state during redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-eleken-bg">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[#c17555] mb-4"></div>
        <p className="text-gray-600">Loading CryptoSage...</p>
      </div>
    </div>
  )
}
