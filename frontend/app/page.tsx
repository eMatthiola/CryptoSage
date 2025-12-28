'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getApiUrl, config } from '@/lib/config'

export default function Home() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [apiData, setApiData] = useState<any>(null)

  useEffect(() => {
    checkApiStatus()
  }, [])

  const checkApiStatus = async () => {
    try {
      const response = await fetch(getApiUrl(config.endpoints.health))
      const data = await response.json()
      setApiData(data)
      setApiStatus('online')
    } catch (error) {
      setApiStatus('offline')
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            CryptoSage AI
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Real-time Market Intelligence & Information Aggregation
          </p>
          <p className="text-sm text-gray-500 mt-2">
            快速感知市场变化 · 多源信息聚合 · AI 智能解读
          </p>
        </div>

        {/* API Status Card */}
        <div className="mb-12 p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <h2 className="text-2xl font-semibold mb-4">System Status</h2>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-gray-600 dark:text-gray-400">Frontend:</span>
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              ✓ Online
            </span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-gray-600 dark:text-gray-400">Backend API:</span>
            {apiStatus === 'checking' && (
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                Checking...
              </span>
            )}
            {apiStatus === 'online' && (
              <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                ✓ Online
              </span>
            )}
            {apiStatus === 'offline' && (
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                ✗ Offline
              </span>
            )}
          </div>

          {apiData && (
            <div className="mt-4 p-4 rounded bg-gray-50 dark:bg-gray-800">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(apiData, null, 2)}
              </pre>
            </div>
          )}

          {apiStatus === 'offline' && (
            <div className="mt-4 p-4 rounded bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                💡 Backend API is not running. Start it with:
                <code className="block mt-2 p-2 bg-gray-800 text-white rounded">
                  cd backend && uvicorn app.main:app --reload
                </code>
              </p>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <FeatureCard
            icon="⚡"
            title="Market Radar"
            description="Real-time market change detection with WebSocket - instantly see what's happening"
            href="/dashboard"
          />
          <FeatureCard
            icon="📰"
            title="News Aggregation"
            description="Multi-source news from CoinDesk, Cointelegraph, Decrypt, The Block"
            href="/dashboard"
          />
          <FeatureCard
            icon="🤖"
            title="AI Intelligence"
            description="Understand market changes with AI-powered analysis and interpretation"
            href="/chat"
          />
        </div>

        {/* Quick Links */}
        <div className="flex gap-4 justify-center mb-8">
          <Link
            href="/dashboard"
            className="px-8 py-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition font-semibold text-lg"
          >
            Get Started →
          </Link>
          <a
            href={getApiUrl(config.endpoints.docs)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-4 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            API Docs
          </a>
        </div>

        {/* Info Box */}
        <div className="mb-8 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
            💡 CryptoSage AI is an information aggregation platform. We help you understand market changes, but we do NOT provide trading signals or investment advice.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-gray-500">
          <p>CryptoSage AI v0.1.0 - Real-time Market Intelligence Platform</p>
          <p className="mt-2">
            Built with Next.js 14, FastAPI, WebSocket & AI
          </p>
        </div>
      </div>
    </main>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  href
}: {
  icon: string
  title: string
  description: string
  href: string
}) {
  return (
    <Link href={href}>
      <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition cursor-pointer">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </Link>
  )
}
